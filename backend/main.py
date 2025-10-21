from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Literal, Optional, List
import os
import json
import re
import logging

from ollama import Client
from utils import chunk_text, process_pdf_content

# ---- Logging Configuration ----
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ---- Environment Variable Validation ----
OLLAMA_API_KEY = os.getenv('OLLAMA_API_KEY')
if not OLLAMA_API_KEY:
    raise RuntimeError("OLLAMA_API_KEY environment variable is required. Please set it in your .env file.")

# ---- Configuration Constants ----
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_TEXT_LENGTH = 500_000  # 500KB of text
DEFAULT_FLASHCARD_COUNT = 5
OLLAMA_MODEL = "gpt-oss:120b-cloud"

# ---- FastAPI Setup ----
app = FastAPI(
    title="AI-Learning API",
    version="0.1.0",
    description="Generate flashcards from PDFs or text using AI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Pydantic Models ----
class Flashcard(BaseModel):
    """Single flashcard with question and answer"""
    question: str
    answer: str
    
    @field_validator('question', 'answer')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Question and answer cannot be empty")
        return v.strip()


class GenerateRequest(BaseModel):
    """Request model for flashcard generation"""
    text: str
    mode: Literal["flashcards", "quiz", "test"]
    num_cards: Optional[int] = DEFAULT_FLASHCARD_COUNT
    
    @field_validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text cannot be empty")
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Text too large. Maximum size is {MAX_TEXT_LENGTH} characters (~500KB)")
        return v.strip()
    
    @field_validator('num_cards')
    def validate_num_cards(cls, v):
        if v is not None and (v < 1 or v > 20):
            raise ValueError("Number of cards must be between 1 and 20")
        return v


class UploadResponse(BaseModel):
    """Response model for upload endpoint"""
    extracted_text: str
    chunks: List[str]
    file_info: Optional[dict] = None


class GenerateResponse(BaseModel):
    """Response model for generate endpoint"""
    flashcards: List[Flashcard]
    summary: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    ollama_configured: bool


# ---- Health Check Endpoint ----
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check if the API is running and properly configured.
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "ollama_configured": bool(OLLAMA_API_KEY)
    }


# ---- Upload Endpoint ----
@app.post("/upload", response_model=UploadResponse)
async def upload(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None)
):
    """
    Upload a PDF file or provide text directly for processing.
    
    - **file**: PDF file to extract text from (max 10MB)
    - **text**: Direct text input (max 500KB)
    
    Returns extracted text split into manageable chunks.
    """
    logger.info(f"Upload request received - file: {file.filename if file else 'none'}, text_length: {len(text) if text else 0}")
    
    # Validate that at least one input is provided
    if file is None and (text is None or text.strip() == ""):
        raise HTTPException(
            status_code=400,
            detail="Please provide either a PDF file or text input"
        )
    
    extracted_text = ""
    file_info = None
    
    # Process file upload
    if file is not None:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported. Please upload a .pdf file."
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
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
            )
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        # Extract text from PDF
        try:
            extracted_text = process_pdf_content(content)
            logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF")
        except Exception as e:
            logger.error(f"PDF processing failed: {str(e)}", exc_info=True)
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
        
        file_info = {
            "filename": file.filename,
            "size_bytes": len(content),
            "extracted_chars": len(extracted_text),
            "processed": True
        }
    else:
        # Use provided text
        extracted_text = text.strip()
        
        # Validate text length
        if len(extracted_text) > MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=413,
                detail=f"Text exceeds {MAX_TEXT_LENGTH} character limit (~500KB)"
            )
    
    # Chunk the text
    try:
        chunks = chunk_text(extracted_text)
        logger.info(f"Text split into {len(chunks)} chunks")
    except Exception as e:
        logger.error(f"Text chunking failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process text. Please try again."
        )
    
    return {
        "extracted_text": extracted_text,
        "chunks": chunks,
        "file_info": file_info
    }


# ---- Generate Endpoint ----
@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Generate flashcards, quizzes, or tests from provided text.
    
    - **text**: Source text for generation (max 500KB)
    - **mode**: Type of content to generate (currently only "flashcards" supported)
    - **num_cards**: Number of flashcards to generate (1-20, default 5)
    
    Returns a list of generated flashcards with questions and answers.
    """
    logger.info(f"Generate request - mode: {req.mode}, text_length: {len(req.text)}, num_cards: {req.num_cards}")
    
    # Check if mode is supported
    if req.mode != "flashcards":
        raise HTTPException(
            status_code=501,
            detail=f"'{req.mode}' mode is not yet implemented. Currently only 'flashcards' mode is supported."
        )
    
    # Generate flashcards
    try:
        flashcards = generate_flashcards_with_ollama(
            req.text,
            num_cards=req.num_cards or DEFAULT_FLASHCARD_COUNT
        )
        logger.info(f"Successfully generated {len(flashcards)} flashcards")
    except ValueError as e:
        logger.error(f"Flashcard generation failed: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to generate flashcards: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating flashcards. Please try again."
        )
    
    return {
        "flashcards": flashcards,
        "summary": f"Generated {len(flashcards)} flashcards from {len(req.text)} characters of text"
    }


# ---- Ollama Integration ----
def generate_flashcards_with_ollama(text: str, num_cards: int = DEFAULT_FLASHCARD_COUNT) -> List[Flashcard]:
    """
    Generate flashcards using Ollama cloud API.
    
    Args:
        text: Source text to generate flashcards from
        num_cards: Number of flashcards to generate
        
    Returns:
        List of Flashcard objects
        
    Raises:
        ValueError: If response cannot be parsed into valid flashcards
    """
    try:
        # Initialize Ollama client
        client = Client(
            host="https://ollama.com",
            headers={"Authorization": f"Bearer {OLLAMA_API_KEY}"}
        )
        
        # Create prompt
        prompt = f"""Generate exactly {num_cards} educational flashcards from the following text.

IMPORTANT: Return ONLY a JSON array of objects. Each object must have exactly two fields:
- "question": A clear, specific question
- "answer": A concise, accurate answer

Format example:
[
  {{"question": "What is...", "answer": "It is..."}},
  {{"question": "How does...", "answer": "It works by..."}}
]

Text to analyze:
{text[:5000]}
"""
        
        messages = [{"role": "user", "content": prompt}]
        
        # Stream response from Ollama
        response_text = ""
        try:
            for part in client.chat(OLLAMA_MODEL, messages=messages, stream=True):
                response_text += part["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama API call failed: {str(e)}")
            raise ValueError(f"Failed to communicate with AI service: {str(e)}")
        
        # Parse response
        flashcards = parse_flashcard_response(response_text)
        
        # Validate we got the requested number (or close to it)
        if len(flashcards) == 0:
            raise ValueError("No flashcards were generated. The AI response was empty or invalid.")
        
        return flashcards
        
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in flashcard generation: {str(e)}", exc_info=True)
        raise ValueError(f"Flashcard generation failed: {str(e)}")


def parse_flashcard_response(response_text: str) -> List[Flashcard]:
    """
    Parse Ollama response into validated Flashcard objects.
    Handles responses with or without markdown code blocks.
    
    Args:
        response_text: Raw text response from Ollama
        
    Returns:
        List of validated Flashcard objects
        
    Raises:
        ValueError: If response cannot be parsed into valid flashcards
    """
    # Remove markdown code blocks if present
    cleaned_text = re.sub(r'```(?:json)?\s*\n?', '', response_text)
    cleaned_text = cleaned_text.replace('```', '').strip()
    
    # Try to find JSON array in the response
    # Look for pattern like [{...}, {...}]
    json_match = re.search(r'\[\s*\{.*?\}\s*\]', cleaned_text, re.DOTALL)
    if json_match:
        cleaned_text = json_match.group(0)
    
    # Parse JSON
    try:
        data = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {str(e)}\nResponse: {response_text[:500]}")
        raise ValueError("AI returned invalid response format. Please try again.")
    
    # Handle different response structures
    if isinstance(data, dict):
        # Response might be {"flashcards": [...]}
        if "flashcards" in data:
            data = data["flashcards"]
        else:
            raise ValueError("Unexpected response structure from AI")
    
    if not isinstance(data, list):
        raise ValueError("AI response is not a list of flashcards")
    
    # Validate and convert to Flashcard objects
    flashcards = []
    for i, item in enumerate(data):
        try:
            if not isinstance(item, dict):
                logger.warning(f"Skipping invalid flashcard at index {i}: not a dict")
                continue
                
            # Extract question and answer with fallbacks
            question = item.get("question", "").strip()
            answer = item.get("answer", "").strip()
            
            if not question or not answer:
                logger.warning(f"Skipping flashcard at index {i}: missing question or answer")
                continue
            
            flashcard = Flashcard(question=question, answer=answer)
            flashcards.append(flashcard)
            
        except Exception as e:
            logger.warning(f"Failed to parse flashcard at index {i}: {str(e)}")
            continue
    
    if len(flashcards) == 0:
        raise ValueError("No valid flashcards could be extracted from AI response")
    
    return flashcards


# ---- Error Handler for Startup ----
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("=" * 60)
    logger.info("AI-Learning API Starting Up")
    logger.info(f"Version: 0.1.0")
    logger.info(f"Ollama API Key: {'✓ Configured' if OLLAMA_API_KEY else '✗ Missing'}")
    logger.info(f"Max File Size: {MAX_FILE_SIZE_MB}MB")
    logger.info(f"Max Text Length: {MAX_TEXT_LENGTH} chars")
    logger.info("=" * 60)