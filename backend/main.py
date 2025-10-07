from dotenv import load_dotenv
load_dotenv()  # loads environment variables from .env

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
import os
import json
import re

from ollama import Client  # Ollama cloud client
from utils import chunk_text, process_pdf_content

# ---- FastAPI setup ----
app = FastAPI(title="AI-Learning API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Request model ----
class GenerateRequest(BaseModel):
    text: str
    mode: Literal["flashcards", "quiz", "test"]

# ---- Upload endpoint ----
@app.post("/upload")
async def upload(file: Optional[UploadFile] = File(default=None), text: Optional[str] = Form(default=None)):
    if file is None and (text is None or text.strip() == ""):
        return {"error": "Provide a PDF in 'file' or text in 'text'"}

    if file is not None:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return {"error": "Only PDF files are supported"}
        
        # Validate file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            return {"error": "File size too large. Maximum size is 10MB"}
        
        if len(content) == 0:
            return {"error": "Uploaded file is empty"}
        
        try:
            # Process PDF with real text extraction
            extracted = process_pdf_content(content)
            
            if not extracted.strip():
                return {"error": "No text could be extracted from the PDF. The file might be image-based or corrupted."}
                
        except Exception as e:
            return {"error": f"Failed to process PDF: {str(e)}"}
    else:
        extracted = text or ""

    chunks = chunk_text(extracted)
    return {
        "extracted_text": extracted, 
        "chunks": chunks,
        "file_info": {
            "filename": file.filename if file else None,
            "size": len(content) if file else len(extracted),
            "processed": True
        } if file else None
    }

# ---- Generate endpoint ----
@app.post("/generate")
async def generate(req: GenerateRequest):
    if req.mode != "flashcards":
        return {"error": "Only flashcards mode is supported for now"}

    flashcards = generate_flashcards_with_ollama(req.text, num_cards=5)
    return {
        "flashcards": flashcards,
        "summary": f"Generated {len(flashcards)} flashcards from {len(req.text)} characters"
    }

# ---- Ollama integration ----
def generate_flashcards_with_ollama(text: str, num_cards: int = 5):
    """
    Calls Ollama cloud to generate flashcards from text.
    Handles JSON returned in Markdown code blocks.
    """
    # Initialize Ollama client pointing at cloud
    client = Client(
        host="https://ollama.com",
        headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API_KEY')}"}
    )

    prompt = f"""
    Generate {num_cards} educational flashcards from the following text.
    Format the output as JSON with "question" and "answer" fields:

    {text}
    """
    messages = [{"role": "user", "content": prompt}]

    # Stream the response
    response_text = ""
    for part in client.chat("gpt-oss:120b-cloud", messages=messages, stream=True):
        response_text += part["message"]["content"]

    # Strip ```json and ``` markers if present
    cleaned_text = re.sub(r"```(?:json)?\n?", "", response_text).replace("```", "").strip()

    # Parse JSON safely
    try:
        flashcards = json.loads(cleaned_text)
        return flashcards
    except Exception as e:
        print("JSON parsing failed:", e)
        return [{"question": "Parsing failed", "answer": response_text}]
