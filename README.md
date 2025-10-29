# AI-Learning

A full-stack web application that helps users generate and study flashcards using AI.
Built with Next.js (frontend) and FastAPI (backend), this platform connects to the Ollama API for AI-powered text processing, converting uploaded PDFs or text into structured, study-ready flashcards.

## Purpose

This project was built as a free, open-source alternative to Quizlet. Its made for students who want to create AI-generated flashcards without subscriptions or paywalls.
The goal is to make studying faster, easier, and more accessible by automating the creation of flashcards.

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- A Ollama API key (remote): set in your .env file as OLLAMA_API_KEY)

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (with Turbopack)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4 + Next Themes (Dark/Light mode)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Utilities:** UUID for unique flashcard IDs
- **Linting & Tooling:** ESLint, TypeScript, PostCSS

### Backend
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Text Parsing:** PyMuPDF for PDF extraction
- **AI Integration:** Ollama API (remote, not local)
- **Cross-Origin Handling:** FastAPI CORS middleware

### Dev Environment
- **Frontend Start:** `npm run dev` (Next.js Turbopack)
- **Backend Start:** `uvicorn main:app --reload`
- **IDE:** Recommended: VS Code with Python + ESLint extensions

## Features
- **AI-Powered Flashcard Generation** — Automatically creates flashcards from PDFs or text using AI.
- **PDF Parsing** — Extracts text from PDFs with PyMuPDF.
- **Editable Flashcards** — Add, remove, or modify cards directly in the UI.
- **Fast, Interactive UI** — Smooth animations and transitions with Framer Motion.
- **Dark / Light Mode** — Persistent theme selection powered by Next Themes.
- **Seamless API Communication** — REST integration between FastAPI and Next.js.
- **Modular Architecture** — Reusable React components built for scalability.

## Backend (FastAPI)

1. Create and activate a virtual environment (optional but recommended):

```bash
cd backend
python -m venv venv
# Windows PowerShell
./venv/Scripts/Activate.ps1
# Or cmd
venv\Scripts\activate.bat
```

2. Install dependencies from requirements.txt:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API base: `http://localhost:8000`
- CORS is enabled for `http://localhost:3000`.

### Endpoints
- GET /health — Returns API health status, version, and whether the Ollama API key is configured.
- POST /upload — Accepts form-data with file (PDF) or text (string). Extracts text and splits it into chunks using PyMuPDF.
- POST /generate — Accepts JSON { "text": string, "mode": "flashcards", "num_cards": number }. Uses the Ollama API to generate flashcards from the given text. *(Currently only the "flashcards" mode is implemented.)*

## Frontend (Next.js)

1. Install dependencies and run dev server:

```bash
cd ../frontend
npm install
npm run dev
```

- App: `http://localhost:3000`

## How to use

- Upload: Drag and drop a PDF or paste text directly into the upload section.
- Mode Selection: Choose between Flashcards, Quiz, or Test generation.
- Generate: Click Generate to send your content to the backend for AI processing.
- View Results: Instantly see generated flashcards or questions in the viewer.
- Edit Flashcards: Modify or delete any generated card directly in the browser.
- Save Sets: Organize and store flashcard sets locally for later review.
- Theme Toggle: Switch between light and dark mode for comfortable viewing.
- Navigation: Use the sidebar to move between Generate, Library, and future tools.

## Future Improvements

- User authentication and cloud-based flashcard saving
- Export/import flashcard sets (JSON, CSV, Anki)
- Multiple document uploads and batch processing
- Learning statistics and spaced repetition tracking
- Enhanced error handling and backend optimization
- Mobile UI and touch-screen performance improvements
- Multi-language support for international users
