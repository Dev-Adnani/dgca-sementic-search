import fitz
import logging

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF file using PyMuPDF
    """
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        logging.error(f"Error extracting text from {pdf_path}: {str(e)}")
        return ""

def clean_text(text: str) -> str:
    """
    Clean extracted text by removing excessive whitespace and formatting issues
    """
    text = ' '.join(text.split())
    text = text.replace('\x00', '')
    text = text.replace('\uf0b7', '•')
    return text
