"""
PDF processing service for AI-Learning API.
Handles file validation, text extraction, and processing.
"""

from fastapi import UploadFile, HTTPException
import logging

from utils.text_utils import process_pdf_content, chunk_text
from config import settings
from models import FileInfo

logger = logging.getLogger(__name__)


class PDFService:
    """Service for handling PDF upload and processing operations."""
    
    @staticmethod
    async def validate_and_process_upload(file: UploadFile) -> tuple[str, FileInfo]:
        """
        Validate and process an uploaded PDF file.
        
        Args:
            file: Uploaded PDF file
            
        Returns:
            Tuple of (extracted_text, file_info)
            
        Raises:
            HTTPException: If validation or processing fails
        """
        # Validate file type
        if not PDFService._is_valid_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Only {', '.join(settings.ALLOWED_FILE_TYPES)} files are supported"
            )
        
        # Read file content
        try:
            content = await file.read()
        except Exception as e:
            logger.error(f"Failed to read uploaded file: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to read uploaded file. Please try again."
            )
        
        # Validate file size
        if len(content) > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
            )
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        # Extract and process text
        try:
            extracted_text = process_pdf_content(content)
            logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF: {file.filename}")
        except Exception as e:
            logger.error(f"PDF processing failed for {file.filename}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=422,
                detail="Unable to process PDF. Please ensure it's a valid, text-based PDF (not scanned images)."
            )
        
        # Validate extracted text
        if not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No text could be extracted from the PDF. The file might be image-based or corrupted."
            )
        
        # Create file info
        file_info = FileInfo(
            filename=file.filename,
            size_bytes=len(content),
            extracted_chars=len(extracted_text),
            processed=True
        )
        
        return extracted_text, file_info
    
    @staticmethod
    def _is_valid_file_type(filename: str) -> bool:
        """Check if filename has a valid extension."""
        return any(filename.lower().endswith(ext) for ext in settings.ALLOWED_FILE_TYPES)
    
    @staticmethod
    def validate_text_length(text: str) -> None:
        """
        Validate that text length is within acceptable limits.
        
        Args:
            text: Text to validate
            
        Raises:
            HTTPException: If text exceeds maximum length
        """
        if len(text) > settings.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=413,
                detail=f"Text exceeds {settings.MAX_TEXT_LENGTH} character limit (~500KB)"
            )
    
    @staticmethod
    def process_text_input(text: str) -> str:
        """
        Process and validate direct text input.
        
        Args:
            text: Input text
            
        Returns:
            Cleaned text
            
        Raises:
            HTTPException: If text is invalid or too long
        """
        cleaned_text = text.strip()
        
        if not cleaned_text:
            raise HTTPException(
                status_code=400,
                detail="Text input cannot be empty"
            )
        
        PDFService.validate_text_length(cleaned_text)
        
        return cleaned_text
    
    @staticmethod
    def chunk_text_safely(text: str) -> list[str]:
        """
        Safely chunk text with error handling.
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
            
        Raises:
            HTTPException: If chunking fails
        """
        try:
            chunks = chunk_text(text)
            logger.info(f"Text split into {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Text chunking failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process text. Please try again."
            )


# Convenience functions for backward compatibility
async def process_uploaded_pdf(file: UploadFile) -> tuple[str, FileInfo]:
    """Process an uploaded PDF file. Wrapper for PDFService method."""
    return await PDFService.validate_and_process_upload(file)


def process_text_input(text: str) -> str:
    """Process direct text input. Wrapper for PDFService method."""
    return PDFService.process_text_input(text)


def chunk_processed_text(text: str) -> list[str]:
    """Chunk processed text. Wrapper for PDFService method."""
    return PDFService.chunk_text_safely(text)