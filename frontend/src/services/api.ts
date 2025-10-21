/**
 * API Service Layer
 * 
 * Centralized API client for all backend interactions.
 * Provides type-safe methods for uploading, generating flashcards, quizzes, and tests.
 */

import { API_BASE_URL, API_ENDPOINTS, DEFAULT_ITEM_COUNT } from '@/config/api';
import { post, postFormData, get } from '@/lib/fetcher';
import type {
  UploadResponse,
  GenerateResponse,
  QuizResponse,
  TestResponse,
  HealthResponse,
} from '@/types/api';

/**
 * Upload API
 * Handles file uploads and text extraction
 */
export const uploadAPI = {
  /**
   * Upload a PDF file or text for processing
   * @param formData - FormData containing 'file' and/or 'text' fields
   * @returns Upload response with extracted text and chunks
   */
  upload: async (formData: FormData): Promise<UploadResponse> => {
    return postFormData<UploadResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.UPLOAD}`,
      formData,
      { retries: 1 } // Retry once on failure
    );
  },
};

/**
 * Flashcard Generation API
 * Handles generating flashcards from text
 */
export const flashcardAPI = {
  /**
   * Generate flashcards from text
   * @param text - Source text to generate flashcards from
   * @param numCards - Number of flashcards to generate (optional)
   * @returns Generated flashcards with summary
   */
  generate: async (
    text: string,
    numCards?: number
  ): Promise<GenerateResponse> => {
    return post<GenerateResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.GENERATE}`,
      {
        text,
        mode: 'flashcards',
        num_cards: numCards || DEFAULT_ITEM_COUNT,
      },
      { retries: 2 } // Retry twice for generation (can be slow)
    );
  },
};

/**
 * Quiz Generation API
 * Handles generating multiple choice quizzes
 */
export const quizAPI = {
  /**
   * Generate multiple choice quiz questions from text
   * @param text - Source text to generate quiz from
   * @param numQuestions - Number of questions to generate (optional)
   * @returns Generated quiz questions with summary
   */
  generate: async (
    text: string,
    numQuestions?: number
  ): Promise<QuizResponse> => {
    return post<QuizResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.GENERATE_QUIZ}`,
      {
        text,
        mode: 'quiz',
        num_cards: numQuestions || DEFAULT_ITEM_COUNT,
      },
      { retries: 2 }
    );
  },
};

/**
 * Test Generation API
 * Handles generating comprehensive tests with mixed question types
 */
export const testAPI = {
  /**
   * Generate a comprehensive test with multiple question types
   * @param text - Source text to generate test from
   * @param numQuestions - Total number of questions to generate (optional)
   * @returns Generated test with MC, T/F, and SA questions
   */
  generate: async (
    text: string,
    numQuestions?: number
  ): Promise<TestResponse> => {
    return post<TestResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.GENERATE_TEST}`,
      {
        text,
        mode: 'test',
        num_cards: numQuestions || 10, // Default 10 for tests
      },
      { retries: 2 }
    );
  },
};

/**
 * Health Check API
 * Checks if the backend is running and configured properly
 */
export const healthAPI = {
  /**
   * Check backend health status
   * @returns Health status and configuration info
   */
  check: async (): Promise<HealthResponse> => {
    return get<HealthResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`,
      { retries: 0 } // Don't retry health checks
    );
  },
};

/**
 * Combined API client
 * Export a single object with all API methods
 */
export const api = {
  upload: uploadAPI,
  flashcard: flashcardAPI,
  quiz: quizAPI,
  test: testAPI,
  health: healthAPI,
};