import os
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# --- CONFIGURATION ---
REPORTS_PAGE_URL = "https://www.dgca.gov.in/digigov-portal/?baseLocale=en_US?dynamicPage=AccidentReports/500005/0/viewApplicationDtlsReq"
DOWNLOAD_FOLDER = os.path.join(os.getcwd(), "pdfs", "accident")
URL_MAPPING_FILE = os.path.join(os.getcwd(), "pdfs", "accident_url_mapping.json")
WAIT_TIMEOUT = 45
# --- END OF CONFIGURATION ---

def main():
    print("🚀 Starting Simplified DGCA Downloader (for Firefox)...")

    if not os.path.exists(DOWNLOAD_FOLDER):
        os.makedirs(DOWNLOAD_FOLDER)

    # Configure Firefox Options for automatic PDF downloading
    firefox_options = webdriver.FirefoxOptions()
    firefox_options.set_preference("browser.download.folderList", 2)
    firefox_options.set_preference("browser.download.dir", DOWNLOAD_FOLDER)
    firefox_options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/pdf,application/octet-stream")
    firefox_options.set_preference("pdfjs.disabled", True)

    # Setup Selenium WebDriver for Firefox
    print("Setting up Firefox WebDriver...")
    service = Service(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=firefox_options)
    
    driver.maximize_window()
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    try:
        print(f"Navigating to the reports page...")
        driver.get(REPORTS_PAGE_URL)

        current_page = 1
        while True:
            print(f"\n📄 Processing Page {current_page}...")
            wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr/td/a")))
            
            report_links = driver.find_elements(By.XPATH, "//tbody/tr/td/a")
            print(f"Found {len(report_links)} reports on this page.")

            # Load existing URL mapping
            url_mapping = {}
            if os.path.exists(URL_MAPPING_FILE):
                try:
                    with open(URL_MAPPING_FILE, 'r') as f:
                        url_mapping = json.load(f)
                except:
                    url_mapping = {}
            
            for index, link in enumerate(report_links):
                print(f"  -> Downloading report #{index + 1}...")
                
                # Extract data-url attribute
                data_url = link.get_attribute('data-url') or ''
                
                try:
                    files_before = os.listdir(DOWNLOAD_FOLDER)
                    driver.execute_script("arguments[0].click();", link)
                    
                    download_wait_start = time.time()
                    while True:
                        files_after = os.listdir(DOWNLOAD_FOLDER)
                        new_files = [f for f in files_after if f not in files_before]
                        if new_files and not any(".part" in f for f in new_files):
                            downloaded_file = new_files[0]
                            print(f"     ✅ Download complete: {downloaded_file}")
                            
                            # Store URL mapping if data-url exists
                            if data_url:
                                url_mapping[downloaded_file] = data_url
                                os.makedirs(os.path.dirname(URL_MAPPING_FILE), exist_ok=True)
                                with open(URL_MAPPING_FILE, 'w') as f:
                                    json.dump(url_mapping, f, indent=2)
                                print(f"     📎 Stored URL mapping for {downloaded_file}")
                            
                            break
                        if time.time() - download_wait_start > 90:
                            print("     ❌ Download timed out.")
                            break
                        time.sleep(1)
                except Exception as e:
                    print(f"     ❌ An error occurred for this report: {e}")
                    continue

            # **UPDATED PAGINATION LOGIC**
            print("\nFinished all reports on this page. Looking for 'Next' button...")
            try:
                # Find the list item (li) that contains the 'Next' link
                next_button_li = driver.find_element(By.XPATH, "//li[contains(@class, 'paginate_button') and a/text()='Next']")

                # Check if the button's parent list item is disabled
                if "disabled" in next_button_li.get_attribute("class"):
                    print("'Next' button is disabled. Last page reached.")
                    break # Exit the main while loop

                # If not disabled, find the actual link inside and click it
                next_button_link = next_button_li.find_element(By.TAG_NAME, 'a')
                print("Clicking 'Next'...")
                driver.execute_script("arguments[0].click();", next_button_link)
                current_page += 1
                time.sleep(2) # Wait for page to reload

            except NoSuchElementException:
                print("Could not find a clickable 'Next' button. Assuming it's the last page.")
                break # Exit the main while loop

    except Exception as e:
        print(f"\nAn unexpected script-level error occurred: {e}")
    finally:
        print("\nClosing the browser.")
        driver.quit()

if __name__ == "__main__":
    main()
