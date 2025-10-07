# AI-Learning (Minimal Full-Stack Starter)

A minimal working full-stack project that converts PDFs or text into mock flashcards, quizzes, and short tests.

- Frontend: Next.js 15 + TypeScript + TailwindCSS
- Backend: FastAPI (Python)

This starter returns mock data only (no real AI). It's meant to be a clean foundation.

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+

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

2. Install dependencies (FastAPI + Uvicorn):

```bash
pip install fastapi uvicorn
```

3. Run the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API base: `http://localhost:8000`
- CORS is enabled for `http://localhost:3000`.

### Endpoints
- `POST /upload` — accepts form-data with `file` (PDF) and/or `text` (string). Returns mock extracted text and chunks.
- `POST /generate` — JSON body `{ text: string, mode: "flashcards"|"quiz"|"test" }`. Returns mock structured JSON.

## Frontend (Next.js)

1. Install dependencies and run dev server:

```bash
cd ../frontend
npm install
npm run dev
```

- App: `http://localhost:3000`

The home page lets you upload a PDF or paste text, choose a mode, and generate mock results, styled minimally with Tailwind.

## Project Structure

```
backend/
  main.py           # FastAPI app with /upload and /generate
  utils.py          # placeholder chunk_text()
frontend/
  src/app/page.tsx  # UI for upload, mode select, rendering results
  src/types/api.ts  # TypeScript interfaces for API responses
```

## Notes
- PDF parsing is mocked. The backend only measures uploaded file size and returns a fake extracted string.
- You can extend `backend/utils.py` and the `/generate` handler to integrate real chunking and LLMs later.
