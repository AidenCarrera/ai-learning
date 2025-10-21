"""
Pydantic models for AI-Learning API.
Defines request/response schemas with validation.
"""

from pydantic import BaseModel, field_validator
from typing import Literal, Optional, List
from config import settings


# ---- Core Data Models ----

class Flashcard(BaseModel):
    """
    Single flashcard with question and answer.
    
    Used for both request/response and internal representation.
    """
    question: str
    answer: str
    
    @field_validator('question', 'answer')
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Ensure question and answer are not empty"""
        if not v or not v.strip():
            raise ValueError("Question and answer cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is photosynthesis?",
                "answer": "The process by which plants convert light energy into chemical energy"
            }
        }


# ---- Request Models ----

class GenerateRequest(BaseModel):
    """
    Request model for generating flashcards, quizzes, or tests.
    
    Validates input text length and number of cards requested.
    """
    text: str
    mode: Literal["flashcards", "quiz", "test"]
    num_cards: Optional[int] = None
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate text is not empty and within size limits"""
        if not v or not v.strip():
            raise ValueError("Text cannot be empty")
        
        if len(v) > settings.MAX_TEXT_LENGTH:
            raise ValueError(
                f"Text too large. Maximum size is {settings.MAX_TEXT_LENGTH:,} characters (~500KB)"
            )
        
        return v.strip()
    
    @field_validator('num_cards')
    @classmethod
    def validate_num_cards(cls, v: Optional[int]) -> Optional[int]:
        """Validate number of cards is within acceptable range"""
        if v is None:
            return settings.DEFAULT_FLASHCARD_COUNT
        
        if v < settings.MIN_FLASHCARD_COUNT or v > settings.MAX_FLASHCARD_COUNT:
            raise ValueError(
                f"Number of cards must be between {settings.MIN_FLASHCARD_COUNT} "
                f"and {settings.MAX_FLASHCARD_COUNT}"
            )
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Photosynthesis is the process by which plants use sunlight...",
                "mode": "flashcards",
                "num_cards": 5
            }
        }


# ---- Response Models ----

class FileInfo(BaseModel):
    """
    Information about an uploaded file after processing.
    """
    filename: str
    size_bytes: int
    extracted_chars: int
    processed: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "biology_notes.pdf",
                "size_bytes": 245760,
                "extracted_chars": 12450,
                "processed": True
            }
        }


class UploadResponse(BaseModel):
    """
    Response from upload endpoint.
    Contains extracted text, chunks, and optional file metadata.
    """
    extracted_text: str
    chunks: List[str]
    file_info: Optional[FileInfo] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "extracted_text": "Chapter 1: Introduction to Biology...",
                "chunks": [
                    "Chapter 1: Introduction to Biology. Biology is...",
                    "The cell is the basic unit of life..."
                ],
                "file_info": {
                    "filename": "biology_notes.pdf",
                    "size_bytes": 245760,
                    "extracted_chars": 12450,
                    "processed": True
                }
            }
        }


class GenerateResponse(BaseModel):
    """
    Response from generate endpoint.
    Contains generated flashcards and summary information.
    """
    flashcards: List[Flashcard]
    summary: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "flashcards": [
                    {
                        "question": "What is photosynthesis?",
                        "answer": "The process by which plants convert light energy into chemical energy"
                    },
                    {
                        "question": "Where does photosynthesis occur?",
                        "answer": "In the chloroplasts of plant cells"
                    }
                ],
                "summary": "Generated 2 flashcards from 150 characters of text"
            }
        }


class HealthResponse(BaseModel):
    """
    Health check response.
    Indicates API status and configuration state.
    """
    status: Literal["healthy", "unhealthy"]
    version: str
    ollama_configured: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "0.1.0",
                "ollama_configured": True
            }
        }


# ---- Error Response Models ----

class ErrorDetail(BaseModel):
    """
    Detailed error information.
    Used for structured error responses.
    """
    code: str
    message: str
    details: Optional[dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "INVALID_FILE_TYPE",
                "message": "Only PDF files are supported",
                "details": {
                    "allowed_types": [".pdf"],
                    "received_type": ".docx"
                }
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    """
    error: ErrorDetail
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "INVALID_FILE_TYPE",
                    "message": "Only PDF files are supported"
                }
            }
        }


# ---- Internal Models (for service layer) ----

class TextProcessingResult(BaseModel):
    """
    Internal model for text processing results.
    Used by services to pass data between layers.
    """
    text: str
    chunks: List[str]
    stats: dict
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Full extracted text...",
                "chunks": ["Chunk 1...", "Chunk 2..."],
                "stats": {
                    "char_count": 5000,
                    "word_count": 850,
                    "sentence_count": 42
                }
            }
        }


class LLMGenerationRequest(BaseModel):
    """
    Internal model for LLM generation requests.
    Used by LLM service to structure generation calls.
    """
    text: str
    num_items: int
    generation_type: Literal["flashcards", "quiz", "test"]
    max_text_length: int = 5000  # Limit sent to LLM
    
    def get_truncated_text(self) -> str:
        """Get text truncated to max_text_length"""
        if len(self.text) <= self.max_text_length:
            return self.text
        return self.text[:self.max_text_length]


# ---- Validation Helpers ----

def validate_flashcard_list(flashcards: List[dict]) -> List[Flashcard]:
    """
    Validate and convert a list of dictionaries to Flashcard objects.
    
    Args:
        flashcards: List of flashcard dictionaries
        
    Returns:
        List of validated Flashcard objects
        
    Raises:
        ValueError: If any flashcard is invalid
    """
    validated = []
    errors = []
    
    for i, card_data in enumerate(flashcards):
        try:
            card = Flashcard(**card_data)
            validated.append(card)
        except Exception as e:
            errors.append(f"Flashcard {i}: {str(e)}")
    
    if errors and not validated:
        raise ValueError(f"All flashcards invalid: {'; '.join(errors)}")
    
    return validated