from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Document(BaseModel):
    text: str

@app.post("/generate")
def generate_quiz(doc: Document):
    return {"message": f"Quiz generated from {len(doc.text)} characters"}
