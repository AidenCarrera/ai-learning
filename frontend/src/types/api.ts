export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface FlashcardItem {
  question: string;
  answer: string;
}

export interface GenerateResponse {
  flashcards: FlashcardItem[];
  summary?: string;
}

export interface FileInfo {
  filename: string | null;
  size: number;
  processed: boolean;
}

export interface UploadResponse {
  extracted_text: string;
  chunks: string[];
  file_info?: FileInfo;
}

export interface FlashcardEditorProps {
  flashcard: Flashcard;
  onSave: (id: string, question: string, answer: string) => void;
  onCancel: () => void;
}

export interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onUpdate: (id: string, question: string, answer: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}


