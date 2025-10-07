export type GenerationMode = "flashcards" | "quiz" | "test";

export interface FlashcardItem {
  question: string;
  answer: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  correct_index: number;
}

export interface TestItem {
  question: string;
  answer: string;
}

export interface GenerateResponse {
  flashcards: FlashcardItem[];
  quiz: QuizItem[];
  test: TestItem[];
  summary?: string;
}

export interface UploadResponse {
  extracted_text: string;
  chunks: string[];
}


