#!/usr/bin/env python3
"""
Extract data-url attributes from DGCA website for already downloaded PDFs.
This script visits the reports page and extracts data-url mappings without re-downloading PDFs.
"""

import os
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuration
INCIDENT_URL = "https://www.dgca.gov.in/digigov-portal/?baseLocale=hi?dynamicPage=IncidentReports/500006/0/viewApplicationDtlsReq"
ACCIDENT_URL = "https://www.dgca.gov.in/digigov-portal/?baseLocale=en_US?dynamicPage=AccidentReports/500005/0/viewApplicationDtlsReq"

INCIDENT_FOLDER = os.path.join(os.getcwd(), "pdfs", "incident")
ACCIDENT_FOLDER = os.path.join(os.getcwd(), "pdfs", "accident")

INCIDENT_MAPPING_FILE = os.path.join(os.getcwd(), "pdfs", "incident_url_mapping.json")
ACCIDENT_MAPPING_FILE = os.path.join(os.getcwd(), "pdfs", "accident_url_mapping.json")

WAIT_TIMEOUT = 45

def get_existing_pdfs(folder):
    """Get list of existing PDF files"""
    if not os.path.exists(folder):
        return set()
    return {f for f in os.listdir(folder) if f.endswith('.pdf')}

def load_existing_mapping(mapping_file):
    """Load existing URL mapping"""
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_mapping(mapping_file, mapping):
    """Save URL mapping to file"""
    os.makedirs(os.path.dirname(mapping_file), exist_ok=True)
    with open(mapping_file, 'w') as f:
        json.dump(mapping, f, indent=2)

def extract_urls_for_category(driver, reports_url, pdf_folder, mapping_file, category_name):
    """Extract data-url mappings for a category"""
    print(f"\n{'='*60}")
    print(f"Extracting URLs for {category_name} reports...")
    print(f"{'='*60}\n")
    
    existing_pdfs = get_existing_pdfs(pdf_folder)
    print(f"Found {len(existing_pdfs)} existing PDFs in {pdf_folder}")
    
    url_mapping = load_existing_mapping(mapping_file)
    print(f"Loaded {len(url_mapping)} existing URL mappings")
    
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    
    try:
        print(f"Navigating to {category_name} reports page...")
        driver.get(reports_url)
        
        current_page = 1
        new_mappings = 0
        
        while True:
            print(f"\n📄 Processing Page {current_page}...")
            
            try:
                # Wait for reports table to load
                wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr/td/a")))
                
                # Get all report links
                report_links = driver.find_elements(By.XPATH, "//tbody/tr/td/a")
                print(f"Found {len(report_links)} reports on page {current_page}")
                
                # Extract data-url for each link
                for link in report_links:
                    try:
                        # Get link text (usually the filename or report title)
                        link_text = link.text.strip()
                        
                        # Get data-url attribute
                        data_url = link.get_attribute('data-url') or ''
                        
                        if not data_url:
                            continue
                        
                        # Try to match with existing PDFs
                        # The link text might not exactly match filename, so we'll try different strategies
                        matched = False
                        
                        # Strategy 1: Exact match with link text
                        for pdf_file in existing_pdfs:
                            if link_text in pdf_file or pdf_file.replace('.pdf', '') in link_text:
                                if pdf_file not in url_mapping:
                                    url_mapping[pdf_file] = data_url
                                    new_mappings += 1
                                    print(f"  ✅ Mapped: {pdf_file[:50]}... -> {data_url[:30]}...")
                                    matched = True
                                    break
                        
                        # Strategy 2: Store with link text as key (we'll match later)
                        if not matched and link_text:
                            # Store with a key that includes link text for manual matching
                            key = f"__link_text__{link_text}"
                            if key not in url_mapping:
                                url_mapping[key] = data_url
                                print(f"  📝 Stored link text: {link_text[:50]}... -> {data_url[:30]}...")
                    
                    except Exception as e:
                        print(f"  ⚠️  Error processing link: {e}")
                        continue
                
                # Try to go to next page
                print("\nLooking for next page...")
                try:
                    if category_name.lower() == 'incident':
                        next_page_number = current_page + 1
                        next_page_link = wait.until(EC.element_to_be_clickable(
                            (By.XPATH, f"//a[contains(@class, 'paginate_button') and text()='{next_page_number}']")
                        ))
                    else:  # accident
                        next_button_li = driver.find_element(By.XPATH, "//li[contains(@class, 'paginate_button') and a/text()='Next']")
                        if "disabled" in next_button_li.get_attribute("class"):
                            print("'Next' button is disabled. Last page reached.")
                            break
                        next_page_link = next_button_li.find_element(By.TAG_NAME, 'a')
                    
                    print(f"Clicking page {next_page_number if category_name.lower() == 'incident' else 'Next'}...")
                    driver.execute_script("arguments[0].click();", next_page_link)
                    current_page += 1
                    time.sleep(3)  # Wait for page to load
                    
                except (TimeoutException, NoSuchElementException):
                    print("No more pages found.")
                    break
                    
            except TimeoutException:
                print(f"Timeout waiting for page {current_page} to load")
                break
        
        # Save mapping
        save_mapping(mapping_file, url_mapping)
        print(f"\n✅ Saved {len(url_mapping)} total mappings ({new_mappings} new) to {mapping_file}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🔗 DGCA Data-URL Extractor")
    print("=" * 60)
    print("This script extracts data-url attributes for already downloaded PDFs")
    print("=" * 60)
    
    # Setup Firefox driver
    print("\nSetting up Firefox WebDriver...")
    firefox_options = webdriver.FirefoxOptions()
    firefox_options.set_preference("browser.download.folderList", 2)
    service = Service(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=firefox_options)
    driver.maximize_window()
    
    try:
        # Extract for incidents
        extract_urls_for_category(
            driver, 
            INCIDENT_URL, 
            INCIDENT_FOLDER, 
            INCIDENT_MAPPING_FILE,
            "Incident"
        )
        
        # Extract for accidents
        extract_urls_for_category(
            driver, 
            ACCIDENT_URL, 
            ACCIDENT_FOLDER, 
            ACCIDENT_MAPPING_FILE,
            "Accident"
        )
        
        print("\n" + "=" * 60)
        print("✅ URL extraction complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Review the mapping files:")
        print(f"   - {INCIDENT_MAPPING_FILE}")
        print(f"   - {ACCIDENT_MAPPING_FILE}")
        print("2. Manually match any PDFs that weren't auto-matched")
        print("3. Re-run PDF processing: python -m pdf2pinecone")
        print("   (This will read the mappings and add URLs to Pinecone metadata)")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\nClosing browser...")
        driver.quit()

if __name__ == "__main__":
    main()
