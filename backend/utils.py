"""
Text processing utilities for AI-Learning API.
Handles PDF extraction, text cleaning, and intelligent chunking.
"""

from typing import List
import re
import fitz  # PyMuPDF
from config import settings


def chunk_text(text: str, max_chars: int = None) -> List[str]:
    """
    Intelligently chunk text on sentence boundaries.
    Prefers to break at sentence endings rather than mid-sentence.
    
    Args:
        text: Text to chunk
        max_chars: Maximum characters per chunk (defaults to config setting)
        
    Returns:
        List of text chunks
    """
    if not text:
        return []
    
    if max_chars is None:
        max_chars = settings.CHUNK_SIZE_CHARS
    
    # Split on sentence boundaries (., !, ?)
    # This regex looks for sentence endings followed by whitespace
    sentence_pattern = r'(?<=[.!?])\s+'
    sentences = re.split(sentence_pattern, text)
    
    chunks: List[str] = []
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        # If adding this sentence would exceed max_chars
        if len(current_chunk) + len(sentence) + 1 > max_chars:
            # Save current chunk if it has content
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            # If single sentence is longer than max_chars, force split it
            if len(sentence) > max_chars:
                # Split long sentence into smaller pieces
                for i in range(0, len(sentence), max_chars):
                    chunks.append(sentence[i:i + max_chars].strip())
                current_chunk = ""
            else:
                # Start new chunk with this sentence
                current_chunk = sentence + " "
        else:
            # Add sentence to current chunk
            current_chunk += sentence + " "
    
    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from PDF content using PyMuPDF.
    
    Args:
        pdf_content: Raw PDF file bytes
        
    Returns:
        Extracted text from all pages
        
    Raises:
        Exception: If PDF extraction fails
    """
    doc = None
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        
        # Extract text from each page
        for page_num in range(doc.page_count):
            page = doc[page_num]
            page_text = page.get_text()
            
            # Add page text with separator
            text += page_text
            
            # Add space between pages to prevent word concatenation
            if page_num < doc.page_count - 1:
                text += " "
        
        return text
        
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    finally:
        # Always close the document
        if doc:
            doc.close()


def clean_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted text from PDF.
    Removes headers, footers, page numbers, excessive whitespace, etc.
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned and normalized text
    """
    if not text:
        return ""
    
    # Remove excessive line breaks (more than 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove page numbers (standalone numbers at start/end of lines)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    
    # Remove common header/footer patterns
    header_footer_patterns = [
        r'^.*\b(Chapter|Section|Page)\s+\d+.*$',  # Chapter 1, Section 2, Page 3
        r'^.*\b\d{1,2}/\d{1,2}/\d{4}.*$',         # Dates (MM/DD/YYYY)
        r'^.*\b\d{1,2}:\d{2}.*$',                 # Times (HH:MM)
        r'^.*\b(www\.|http://|https://).*$',      # URLs
    ]
    
    for pattern in header_footer_patterns:
        text = re.sub(pattern, '', text, flags=re.MULTILINE | re.IGNORECASE)
    
    # Collapse multiple spaces into single space
    text = re.sub(r' {2,}', ' ', text)
    
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
    
    # Fix common line break issues (hyphenated words split across lines)
    # Pattern: "word-\nword" becomes "wordword"
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # Remove stray punctuation at line breaks
    text = re.sub(r'\n\s*[.,;:!?]+\s*\n', '\n', text)
    
    # Final cleanup: collapse multiple line breaks to maximum of 2
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    return text.strip()


def process_pdf_content(pdf_content: bytes) -> str:
    """
    Complete PDF processing pipeline: extract and clean text.
    
    Args:
        pdf_content: Raw PDF file bytes
        
    Returns:
        Cleaned, extracted text ready for processing
        
    Raises:
        Exception: If PDF processing fails at any stage
    """
    try:
        # Step 1: Extract text from PDF
        raw_text = extract_text_from_pdf(pdf_content)
        
        # Step 2: Clean the extracted text
        cleaned_text = clean_extracted_text(raw_text)
        
        return cleaned_text
        
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")


def validate_text_length(text: str) -> bool:
    """
    Validate that text length is within acceptable limits.
    
    Args:
        text: Text to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not text:
        return False
    
    return len(text) <= settings.MAX_TEXT_LENGTH


def get_text_stats(text: str) -> dict:
    """
    Get statistics about a text string.
    Useful for debugging and logging.
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with text statistics
    """
    if not text:
        return {
            "char_count": 0,
            "word_count": 0,
            "line_count": 0,
            "sentence_count": 0
        }
    
    # Count words (split on whitespace)
    words = text.split()
    
    # Count lines
    lines = text.split('\n')
    
    # Count sentences (approximate - count sentence-ending punctuation)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s for s in sentences if s.strip()]
    
    return {
        "char_count": len(text),
        "word_count": len(words),
        "line_count": len(lines),
        "sentence_count": len(sentences),
        "within_limit": validate_text_length(text)
    }


def preview_text(text: str, max_length: int = 200) -> str:
    """
    Get a preview of text (first N characters with ellipsis).
    
    Args:
        text: Text to preview
        max_length: Maximum preview length
        
    Returns:
        Preview string
    """
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length].strip() + "..."