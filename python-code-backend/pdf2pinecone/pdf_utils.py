import fitz
import logging
import re
from typing import Dict, List, Tuple, Optional
import openai
from openai import OpenAI

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

def extract_structure_from_pdf(pdf_path: str) -> Dict[str, any]:
    """
    Extract structure (headings, sections) from PDF using PyMuPDF
    Returns a dictionary with headings, sections, and their text content
    """
    try:
        doc = fitz.open(pdf_path)
        structure = {
            'headings': [],
            'sections': [],
            'toc': []
        }
        
        # Try to extract table of contents
        try:
            toc = doc.get_toc()
            if toc:
                structure['toc'] = [{'level': item[0], 'title': item[1], 'page': item[2]} for item in toc]
        except:
            pass
        
        # Extract text blocks with formatting to identify headings
        all_text = ""
        headings_found = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            blocks = page.get_text("dict")
            
            for block in blocks.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        line_text = ""
                        is_heading = False
                        font_size = 0
                        
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if text:
                                line_text += text + " "
                                # Heuristics for headings: larger font, bold, or all caps
                                span_font_size = span.get("size", 0)
                                if span_font_size > font_size:
                                    font_size = span_font_size
                                
                                # Check if text looks like a heading
                                if (span.get("flags", 0) & 16) or span.get("font", "").lower().find("bold") != -1:
                                    is_heading = True
                        
                        line_text = line_text.strip()
                        if line_text:
                            all_text += line_text + "\n"
                            
                            # Identify potential headings
                            if (is_heading or 
                                font_size > 12 or 
                                (len(line_text) < 100 and line_text.isupper()) or
                                re.match(r'^\d+\.?\s+[A-Z]', line_text)):
                                headings_found.append({
                                    'text': line_text,
                                    'page': page_num + 1,
                                    'font_size': font_size
                                })
        
        structure['headings'] = headings_found[:20]  # Limit to top 20 headings
        doc.close()
        return structure
    except Exception as e:
        logging.error(f"Error extracting structure from {pdf_path}: {str(e)}")
        return {'headings': [], 'sections': [], 'toc': []}

def identify_key_sections(text: str, structure: Dict) -> List[Tuple[str, str]]:
    """
    Identify key sections of the document based on structure and content
    Returns list of (section_name, section_text) tuples
    """
    key_sections = []
    
    # Use TOC if available
    if structure.get('toc'):
        toc_items = structure['toc']
        text_lines = text.split('\n')
        
        for i, toc_item in enumerate(toc_items[:10]):  # Limit to first 10 TOC items
            section_title = toc_item['title']
            # Try to find section content (simplified - would need page-based extraction for accuracy)
            key_sections.append((section_title, ""))
    
    # Use headings if TOC not available
    elif structure.get('headings'):
        headings = structure['headings'][:10]
        for heading in headings:
            key_sections.append((heading['text'], ""))
    
    # Fallback: identify sections by common patterns
    if not key_sections:
        # Look for common section patterns
        section_patterns = [
            r'(?i)(executive\s+summary|summary)',
            r'(?i)(introduction|background)',
            r'(?i)(findings|analysis|investigation)',
            r'(?i)(conclusion|recommendations)',
            r'(?i)(cause|causes)',
            r'(?i)(recommendation|recommendations)'
        ]
        
        text_lower = text.lower()
        for pattern in section_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                start = match.start()
                # Extract ~500 words after the match
                section_text = text[start:start+3000]
                key_sections.append((match.group(0), section_text[:1000]))
                if len(key_sections) >= 6:
                    break
            if len(key_sections) >= 6:
                break
    
    return key_sections[:6]  # Return top 6 sections

def generate_document_summary(text: str, structure: Dict, filename: str) -> Dict[str, str]:
    """
    Generate a document-level summary using OpenAI
    Returns a dictionary with summary points
    """
    try:
        # Identify key sections
        key_sections = identify_key_sections(text, structure)
        
        # Prepare content for summarization
        summary_prompt = f"""You are analyzing an aviation incident/accident report. 
Generate a concise summary with 3-6 key points that capture the most important information.

Document: {filename}

Key sections identified:
{chr(10).join([f"- {section[0]}" for section in key_sections[:5]])}

Full text (first 4000 characters):
{text[:4000]}

Generate a summary with 3-6 bullet points. Each point should be:
- Concise (1-2 sentences)
- Focused on key facts, findings, or recommendations
- Written in clear, professional language

Format your response as a numbered list (1. 2. 3. etc.) with no additional text."""

        # Initialize OpenAI client
        # Try to get API key from global openai.api_key (old style) or use environment variable
        api_key = None
        if hasattr(openai, 'api_key') and openai.api_key:
            api_key = openai.api_key
        elif hasattr(openai, 'api_key') and openai.api_key is None:
            # API key not set, will use environment variable if available
            api_key = None
        else:
            # Try to get from environment
            import os
            api_key = os.getenv('OPENAI_API_KEY')
        
        client = OpenAI(api_key=api_key) if api_key else OpenAI()
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at summarizing aviation safety reports. Provide clear, concise summaries."},
                {"role": "user", "content": summary_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        summary_text = response.choices[0].message.content.strip()
        
        # Parse summary into points
        summary_points = []
        lines = summary_text.split('\n')
        for line in lines:
            line = line.strip()
            # Remove numbering (1. 2. etc.)
            line = re.sub(r'^\d+[\.\)]\s*', '', line)
            if line and len(line) > 20:  # Filter out very short lines
                summary_points.append(line)
        
        # If parsing failed, use the whole summary as a single point
        if not summary_points:
            summary_points = [summary_text[:500]]
        
        return {
            'summary': '\n'.join(summary_points),
            'summary_points': summary_points,
            'key_sections': [section[0] for section in key_sections]
        }
    except Exception as e:
        logging.error(f"Error generating summary for {filename}: {str(e)}")
        # Fallback: create a simple summary from first part of text
        preview = text[:500] + "..." if len(text) > 500 else text
        return {
            'summary': preview,
            'summary_points': [preview],
            'key_sections': []
        }

def clean_text(text: str) -> str:
    """
    Clean extracted text by removing excessive whitespace and formatting issues
    """
    text = ' '.join(text.split())
    text = text.replace('\x00', '')
    text = text.replace('\uf0b7', '•')
    return text
