from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging

from config import settings, print_config_summary
from models import (
    GenerateRequest,
    UploadResponse,
    GenerateResponse,
    HealthResponse,
)
from services.pdf_service import PDFService
from services.llm_service import get_llm_service

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

# ---- Initialize Services ----
pdf_service = PDFService()
llm_service = get_llm_service()


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
    
    # Process based on input type
    if file is not None:
        # Process uploaded PDF
        extracted_text, file_info = await pdf_service.validate_and_process_upload(file)
    else:
        # Process direct text input
        extracted_text = pdf_service.process_text_input(text)
        file_info = None
    
    # Chunk the text
    chunks = pdf_service.chunk_text_safely(extracted_text)
    
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
    
    # Generate flashcards using LLM service
    try:
        flashcards = llm_service.generate_flashcards(req.text, num_cards=req.num_cards)
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


# ---- Startup Event ----
@app.on_event("startup")
async def startup_event():
    """Log startup information and initialize services"""
    print_config_summary()
    logger.info("Services initialized successfully")
    logger.info("API startup complete - ready to accept requests")


# ---- Shutdown Event ----
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("API shutting down...")