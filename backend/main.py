from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import re
import logging

from ollama import Client
from utils.text_utils import chunk_text, process_pdf_content
from config import settings, print_config_summary
from models import (
    Flashcard,
    GenerateRequest,
    UploadResponse,
    GenerateResponse,
    HealthResponse,
    FileInfo
)

# ---- Logging Configuration ----
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# ---- FastAPI Setup ----
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)


# ---- API Endpoints ----

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check if the API is running and properly configured.
    """
    return HealthResponse(
        status="healthy",
        version=settings.API_VERSION,
        ollama_configured=bool(settings.OLLAMA_API_KEY)
    )


@app.post("/upload", response_model=UploadResponse)
async def upload(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None)
):
    """
    Upload a PDF file or provide text directly for processing.
    
    - **file**: PDF file to extract text from (max configurable MB)
    - **text**: Direct text input (max configurable characters)
    
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
        if not any(file.filename.lower().endswith(ext) for ext in settings.ALLOWED_FILE_TYPES):
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
        
        file_info = FileInfo(
            filename=file.filename,
            size_bytes=len(content),
            extracted_chars=len(extracted_text),
            processed=True
        )
    else:
        # Use provided text
        extracted_text = text.strip()
        
        # Validate text length
        if len(extracted_text) > settings.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=413,
                detail=f"Text exceeds {settings.MAX_TEXT_LENGTH} character limit (~500KB)"
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
    
    return UploadResponse(
        extracted_text=extracted_text,
        chunks=chunks,
        file_info=file_info
    )


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Generate flashcards, quizzes, or tests from provided text.
    
    - **text**: Source text for generation (max configurable characters)
    - **mode**: Type of content to generate (currently only "flashcards" supported)
    - **num_cards**: Number of flashcards to generate (configurable range)
    
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
        flashcards = generate_flashcards_with_ollama(req.text, num_cards=req.num_cards)
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
    
    return GenerateResponse(
        flashcards=flashcards,
        summary=f"Generated {len(flashcards)} flashcards from {len(req.text)} characters of text"
    )


# ---- Ollama Integration ----
# TODO: Move to services/llm_service.py

def generate_flashcards_with_ollama(text: str, num_cards: int = None) -> list[Flashcard]:
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
    if num_cards is None:
        num_cards = settings.DEFAULT_FLASHCARD_COUNT
        
    try:
        # Initialize Ollama client
        client = Client(
            host=settings.OLLAMA_HOST,
            headers=settings.ollama_headers
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
            for part in client.chat(settings.OLLAMA_MODEL, messages=messages, stream=True):
                response_text += part["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama API call failed: {str(e)}")
            raise ValueError(f"Failed to communicate with AI service: {str(e)}")
        
        # Parse response
        flashcards = parse_flashcard_response(response_text)
        
        # Validate we got flashcards
        if len(flashcards) == 0:
            raise ValueError("No flashcards were generated. The AI response was empty or invalid.")
        
        return flashcards
        
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in flashcard generation: {str(e)}", exc_info=True)
        raise ValueError(f"Flashcard generation failed: {str(e)}")


def parse_flashcard_response(response_text: str) -> list[Flashcard]:
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


# ---- Startup Event ----
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    print_config_summary()
    logger.info("API startup complete - ready to accept requests")