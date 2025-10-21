/**
 * Enhanced Fetch Wrapper
 * 
 * Provides a type-safe fetch wrapper with:
 * - Automatic error handling
 * - HTTP status code checking
 * - Type-safe responses
 * - Retry logic with exponential backoff
 */

import { REQUEST_TIMEOUT } from '@/config/api';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Fetcher options extending standard RequestInit
 */
interface FetcherOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch function with error handling and retries
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options with additional retry configuration
 * @returns Parsed JSON response
 * @throws APIError if request fails
 */
export async function fetcher<T>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    timeout = REQUEST_TIMEOUT,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Make the fetch request
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is ok (status 200-299)
        if (!response.ok) {
          // Try to parse error response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let errorCode: string | undefined;

          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
            errorCode = errorData.code;
          } catch {
            // If error response is not JSON, use status text
          }

          throw new APIError(errorMessage, response.status, errorCode);
        }

        // Parse and return JSON response
        const data = await response.json();
        return data as T;

      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort (timeout) errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError(
            `Request timeout after ${timeout}ms`,
            408,
            'TIMEOUT'
          );
        }

        throw error;
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on client errors (4xx) except timeout
      if (error instanceof APIError && error.status && error.status >= 400 && error.status < 500 && error.code !== 'TIMEOUT') {
        throw error;
      }

      // If we have retries left, wait and try again
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // No more retries, throw the last error
      throw lastError;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Request failed');
}

/**
 * Convenience function for GET requests
 */
export async function get<T>(url: string, options?: FetcherOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'GET' });
}

/**
 * Convenience function for POST requests
 */
export async function post<T>(
  url: string,
  body?: unknown,
  options?: FetcherOptions
): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for POST requests with FormData
 */
export async function postFormData<T>(
  url: string,
  formData: FormData,
  options?: FetcherOptions
): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    // Don't set Content-Type header - browser will set it with boundary
    body: formData,
  });
}