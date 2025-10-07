export interface FlashcardItem {
  question: string;
  answer: string;
}

export interface GenerateResponse {
  flashcards: FlashcardItem[];
  summary?: string;
}

export interface UploadResponse {
  extracted_text: string;
  chunks: string[];
}


