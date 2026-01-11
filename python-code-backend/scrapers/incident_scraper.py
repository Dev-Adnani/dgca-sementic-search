import os
import time
import json
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from datetime import datetime

# --- CONFIGURATION ---
REPORTS_PAGE_URL = "https://www.dgca.gov.in/digigov-portal/?baseLocale=hi?dynamicPage=IncidentReports/500006/0/viewApplicationDtlsReq"
# Updated to match our folder structure
DOWNLOAD_FOLDER = os.path.join(os.getcwd(), "pdfs", "incident")
URL_MAPPING_FILE = os.path.join(os.getcwd(), "pdfs", "incident_url_mapping.json")
WAIT_TIMEOUT = 45
MAX_RETRIES = 3
# --- END OF CONFIGURATION ---

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('incident_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def setup_driver():
    """Setup Firefox driver with improved configuration"""
    firefox_options = webdriver.FirefoxOptions()
    
    # Download preferences
    firefox_options.set_preference("browser.download.folderList", 2)
    firefox_options.set_preference("browser.download.dir", DOWNLOAD_FOLDER)
    firefox_options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/pdf,application/octet-stream")
    firefox_options.set_preference("pdfjs.disabled", True)
    firefox_options.set_preference("browser.download.useDownloadDir", True)
    
    # Performance improvements
    firefox_options.set_preference("network.http.pipelining", True)
    firefox_options.set_preference("network.http.proxy.pipelining", True)
    firefox_options.set_preference("network.http.pipelining.maxrequests", 8)
    firefox_options.set_preference("content.notify.interval", 500000)
    firefox_options.set_preference("content.notify.ontimer", True)
    firefox_options.set_preference("content.switch.threshold", 250000)
    
    service = Service(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=firefox_options)
    driver.maximize_window()
    
    return driver

def wait_for_download(download_folder, files_before, timeout=120):
    """Wait for download to complete with better detection"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        files_after = os.listdir(download_folder)
        new_files = [f for f in files_after if f not in files_before]
        
        # Check for completed downloads (no .part or .tmp files)
        completed_files = [f for f in new_files if not any(ext in f for ext in ['.part', '.tmp', '.crdownload'])]
        
        if completed_files:
            return completed_files[0]
        time.sleep(1)
    
    return None

def load_url_mapping():
    """Load existing URL mapping from file"""
    if os.path.exists(URL_MAPPING_FILE):
        try:
            with open(URL_MAPPING_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_url_mapping(mapping):
    """Save URL mapping to file"""
    os.makedirs(os.path.dirname(URL_MAPPING_FILE), exist_ok=True)
    with open(URL_MAPPING_FILE, 'w') as f:
        json.dump(mapping, f, indent=2)

def download_report(driver, link, report_index):
    """Download a single report with retry logic and extract data-url"""
    # Extract data-url attribute before downloading
    data_url = link.get_attribute('data-url') or ''
    
    for attempt in range(MAX_RETRIES):
        try:
            files_before = os.listdir(DOWNLOAD_FOLDER)
            
            # Scroll element into view before clicking
            driver.execute_script("arguments[0].scrollIntoView(true);", link)
            time.sleep(0.5)
            
            # Use JavaScript click for reliability
            driver.execute_script("arguments[0].click();", link)
            
            # Wait for download
            downloaded_file = wait_for_download(DOWNLOAD_FOLDER, files_before)
            
            if downloaded_file:
                logger.info(f"✅ Report #{report_index + 1} downloaded: {downloaded_file}")
                
                # Store URL mapping if data-url exists
                if data_url:
                    url_mapping = load_url_mapping()
                    url_mapping[downloaded_file] = data_url
                    save_url_mapping(url_mapping)
                    logger.info(f"   📎 Stored URL mapping for {downloaded_file}")
                
                return True
            else:
                logger.warning(f"❌ Download timeout for report #{report_index + 1}, attempt {attempt + 1}")
                
        except Exception as e:
            logger.error(f"❌ Error downloading report #{report_index + 1}, attempt {attempt + 1}: {e}")
            
        if attempt < MAX_RETRIES - 1:
            time.sleep(2)  # Wait before retry
    
    logger.error(f"❌ Failed to download report #{report_index + 1} after {MAX_RETRIES} attempts")
    return False

def main():
    start_time = datetime.now()
    logger.info("🚀 Starting DGCA Incident Reports Downloader...")

    # Create download directory
    if not os.path.exists(DOWNLOAD_FOLDER):
        os.makedirs(DOWNLOAD_FOLDER)
        logger.info(f"Created download folder: {DOWNLOAD_FOLDER}")

    driver = setup_driver()
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    
    total_downloaded = 0
    total_failed = 0

    try:
        logger.info(f"Navigating to: {REPORTS_PAGE_URL}")
        driver.get(REPORTS_PAGE_URL)

        current_page = 1
        while True:
            logger.info(f"\n📄 Processing Page {current_page}...")
            
            try:
                # Wait for reports table to load
                wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr/td/a")))
                
                # Get all report links on current page
                report_links = driver.find_elements(By.XPATH, "//tbody/tr/td/a")
                logger.info(f"Found {len(report_links)} reports on page {current_page}")

                # Download each report
                for index, link in enumerate(report_links):
                    logger.info(f"Processing report #{index + 1} on page {current_page}...")
                    
                    if download_report(driver, link, index):
                        total_downloaded += 1
                    else:
                        total_failed += 1
                    
                    # Small delay between downloads
                    time.sleep(1)

                # Try to go to next page
                logger.info("Looking for next page...")
                try:
                    next_page_number = current_page + 1
                    next_page_link = wait.until(EC.element_to_be_clickable(
                        (By.XPATH, f"//a[contains(@class, 'paginate_button') and text()='{next_page_number}']")
                    ))
                    
                    logger.info(f"Clicking page {next_page_number}...")
                    driver.execute_script("arguments[0].click();", next_page_link)
                    current_page += 1
                    time.sleep(3)  # Wait for page to load
                    
                except (TimeoutException, NoSuchElementException):
                    logger.info("No more pages found. Scraping complete!")
                    break
                    
            except TimeoutException:
                logger.error(f"Timeout waiting for page {current_page} to load")
                break

    except Exception as e:
        logger.error(f"Script-level error: {e}")
    finally:
        end_time = datetime.now()
        duration = end_time - start_time
        
        logger.info(f"\n📊 SCRAPING SUMMARY:")
        logger.info(f"   Total pages processed: {current_page}")
        logger.info(f"   Successfully downloaded: {total_downloaded} reports")
        logger.info(f"   Failed downloads: {total_failed} reports")
        logger.info(f"   Duration: {duration}")
        logger.info(f"   Files saved to: {DOWNLOAD_FOLDER}")
        
        logger.info("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    main()
