from typing import List
import re
import fitz  # PyMuPDF


def chunk_text(text: str, max_chars: int = 500) -> List[str]:
    """
    Placeholder chunker that splits text every max_chars characters.
    """
    if not text:
        return []
    chunks: List[str] = []
    for i in range(0, len(text), max_chars):
        chunks.append(text[i : i + max_chars])
    return chunks


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from PDF content using PyMuPDF.
    """
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text += page.get_text()
            # Add a space between pages to prevent word concatenation
            if page_num < doc.page_count - 1:
                text += " "
        
        doc.close()
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def clean_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted text from PDF.
    """
    if not text:
        return ""
    
    # Remove excessive line breaks (more than 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove common headers/footers patterns
    # Remove page numbers (standalone numbers at start/end of lines)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    
    # Remove common header/footer patterns
    header_footer_patterns = [
        r'^.*\b(Chapter|Section|Page)\s+\d+.*$',  # Chapter 1, Section 2, Page 3
        r'^.*\b\d{1,2}/\d{1,2}/\d{4}.*$',  # Dates
        r'^.*\b\d{1,2}:\d{2}.*$',  # Times
        r'^.*\b(www\.|http://|https://).*$',  # URLs
    ]
    
    for pattern in header_footer_patterns:
        text = re.sub(pattern, '', text, flags=re.MULTILINE | re.IGNORECASE)
    
    # Collapse multiple spaces into single space
    text = re.sub(r' +', ' ', text)
    
    # Remove leading/trailing whitespace from each line
    lines = text.split('\n')
    lines = [line.strip() for line in lines]
    
    # Remove empty lines at the beginning and end
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    
    # Join lines back together
    text = '\n'.join(lines)
    
    # Fix common line break issues (words split across lines)
    # Look for patterns like "word-\nword" and join them
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # Remove stray punctuation at line breaks
    text = re.sub(r'\n\s*[.,;:!?]+\s*\n', '\n', text)
    
    # Final cleanup: remove excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    return text.strip()


def process_pdf_content(pdf_content: bytes) -> str:
    """
    Complete PDF processing pipeline: extract and clean text.
    """
    try:
        # Extract text from PDF
        raw_text = extract_text_from_pdf(pdf_content)
        
        # Clean the extracted text
        cleaned_text = clean_extracted_text(raw_text)
        
        return cleaned_text
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")


