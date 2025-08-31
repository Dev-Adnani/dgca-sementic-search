#!/usr/bin/env python3
"""
DGCA Reports Master Scraper
Runs both incident and accident report scrapers.
"""

import sys
import os
import logging
from pathlib import Path

# Add the scrapers directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers'))

from scrapers.incident_scraper import main as run_incident_scraper
from scrapers.accident_scraper import main as run_accident_scraper

def setup_logging():
    """Setup logging for the master scraper"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('master_scraper.log'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def main():
    logger = setup_logging()
    logger.info("🚀 Starting DGCA Reports Master Scraper...")
    
    # Create directories if they don't exist
    incident_dir = Path("pdfs/incident")
    accident_dir = Path("pdfs/accident")
    
    incident_dir.mkdir(parents=True, exist_ok=True)
    accident_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Created directories: {incident_dir}, {accident_dir}")
    
    try:
        # Run incident scraper
        logger.info("\n" + "="*60)
        logger.info("STARTING INCIDENT REPORTS SCRAPER")
        logger.info("="*60)
        run_incident_scraper()
        
        # Run accident scraper
        logger.info("\n" + "="*60)
        logger.info("STARTING ACCIDENT REPORTS SCRAPER")
        logger.info("="*60)
        run_accident_scraper()
        
        logger.info("\n" + "="*60)
        logger.info("✅ ALL SCRAPERS COMPLETED SUCCESSFULLY!")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Error in master scraper: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
