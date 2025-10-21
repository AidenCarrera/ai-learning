/**
 * API Type Definitions
 * 
 * TypeScript interfaces matching the backend Pydantic models.
 * These ensure type safety across the frontend application.
 */

// ============================================
// Flashcard Types
// ============================================

/**
 * Base flashcard item from API (without ID)
 */
export interface FlashcardItem {
  question: string;
  answer: string;
}

/**
 * Flashcard with client-side ID for React key prop
 */
export interface Flashcard extends FlashcardItem {
  id: string;
}

/**
 * Response from flashcard generation endpoint
 */
export interface GenerateResponse {
  flashcards: FlashcardItem[];
  summary: string;
}

// ============================================
// Quiz Types (Multiple Choice)
// ============================================

/**
 * Multiple choice question from API
 */
export interface MultipleChoiceQuestion {
  question: string;
  options: string[]; // Exactly 4 options
  correct_answer: string;
  explanation?: string;
}

/**
 * Multiple choice question with client-side ID
 */
export interface MultipleChoiceQuestionWithId extends MultipleChoiceQuestion {
  id: string;
}

/**
 * Response from quiz generation endpoint
 */
export interface QuizResponse {
  questions: MultipleChoiceQuestion[];
  summary: string;
}

// ============================================
// Test Types (Mixed Question Types)
// ============================================

/**
 * True/False question from API
 */
export interface TrueFalseQuestion {
  question: string;
  correct_answer: boolean;
  explanation?: string;
}

/**
 * Short answer question from API
 */
export interface ShortAnswerQuestion {
  question: string;
  correct_answer: string;
  acceptable_answers?: string[];
  explanation?: string;
}

/**
 * Response from test generation endpoint
 */
export interface TestResponse {
  multiple_choice: MultipleChoiceQuestion[];
  true_false: TrueFalseQuestion[];
  short_answer: ShortAnswerQuestion[];
  summary: string;
}

// ============================================
// Upload Types
// ============================================

/**
 * File metadata from upload
 */
export interface FileInfo {
  filename: string;
  size_bytes: number;
  extracted_chars: number;
  processed: boolean;
}

/**
 * Response from upload endpoint
 */
export interface UploadResponse {
  extracted_text: string;
  chunks: string[];
  file_info?: FileInfo;
}

// ============================================
// Health Check Types
// ============================================

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  ollama_configured: boolean;
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props for FlashcardEditor component
 */
export interface FlashcardEditorProps {
  flashcard: Flashcard;
  onSave: (id: string, question: string, answer: string) => void;
  onCancel: () => void;
}

/**
 * Props for FlashcardsView component
 */
export interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onUpdate: (id: string, question: string, answer: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

/**
 * Props for QuizView component
 */
export interface QuizViewProps {
  questions: MultipleChoiceQuestionWithId[];
  onAnswerSelect: (questionId: string, answer: string) => void;
  showResults?: boolean;
}

/**
 * Props for TestView component
 */
export interface TestViewProps {
  test: TestResponse;
  onSubmit: (answers: TestAnswers) => void;
}

/**
 * User's answers for a test
 */
export interface TestAnswers {
  multiple_choice: Record<string, string>; // question_id -> selected_answer
  true_false: Record<string, boolean>; // question_id -> true/false
  short_answer: Record<string, string>; // question_id -> user_answer
}

// ============================================
// Mode Types
// ============================================

/**
 * Content generation modes
 */
export type GenerationMode = 'flashcards' | 'quiz' | 'test';

/**
 * Mode configuration
 */
export interface ModeConfig {
  id: GenerationMode;
  label: string;
  description: string;
  icon: string;
  defaultCount: number;
}