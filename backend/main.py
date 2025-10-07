from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, List, Optional

from utils import chunk_text


app = FastAPI(title="AI-Learning API", version="0.1.0")

# CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    text: str
    mode: Literal["flashcards", "quiz", "test"]


@app.post("/upload")
async def upload(file: Optional[UploadFile] = File(default=None), text: Optional[str] = Form(default=None)):
    """
    Accepts a PDF file or raw text and returns placeholder extracted text.
    This is a minimal stub – no real PDF parsing.
    """
    if file is None and (text is None or text.strip() == ""):
        return {"error": "Provide a PDF in 'file' or text in 'text'"}

    if file is not None:
        # Just read a small chunk to simulate processing (no parsing)
        content = await file.read()
        size = len(content) if content else 0
        extracted = f"[Mock PDF text] {file.filename} with ~{size} bytes"
    else:
        extracted = text or ""

    # Placeholder use of chunking util
    chunks = chunk_text(extracted)
    return {"extracted_text": extracted, "chunks": chunks}


@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Returns mock structured JSON for flashcards, quiz, or test.
    """
    base_flashcards = [
        {"question": "What is AI?", "answer": "Artificial Intelligence"},
        {"question": "What is ML?", "answer": "Machine Learning"},
    ]
    base_quiz = [
        {"question": "Which is true about AI?", "options": ["A", "B", "C", "D"], "correct_index": 1},
        {"question": "AI is used for?", "options": ["Cooking", "Games", "Sleeping", "None"], "correct_index": 1},
    ]
    base_test = [
        {"question": "Explain machine learning.", "answer": "ML is a subset of AI that learns from data."},
        {"question": "Define supervised learning.", "answer": "Learning from labeled data to predict outputs."},
    ]

    response = {
        "flashcards": base_flashcards if req.mode == "flashcards" else base_flashcards[:1],
        "quiz": base_quiz if req.mode == "quiz" else base_quiz[:1],
        "test": base_test if req.mode == "test" else base_test[:1],
        "summary": f"Generated {req.mode} from {len(req.text)} characters",
    }
    return response
