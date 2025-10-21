/**
 * API Configuration
 * 
 * Centralizes API URL configuration for different environments.
 * Uses Next.js environment variables with fallback to localhost for development.
 */

/**
 * Base URL for the backend API
 * - Production: Uses NEXT_PUBLIC_API_URL from environment
 * - Development: Falls back to http://localhost:8000
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  UPLOAD: '/upload',
  GENERATE: '/generate',
  GENERATE_QUIZ: '/generate/quiz',
  GENERATE_TEST: '/generate/test',
  HEALTH: '/health',
} as const;

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * Maximum file size for uploads (in bytes)
 * Should match backend MAX_FILE_SIZE_MB setting
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = ['.pdf'];

/**
 * Default number of items to generate
 */
export const DEFAULT_ITEM_COUNT = 5;