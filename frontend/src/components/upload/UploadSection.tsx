"use client";

/**
 * UploadSection.tsx
 *
 * Handles uploading a PDF or entering text manually.
 * Sends the content to the FastAPI backend for text extraction,
 * then updates the app state with extracted text for flashcard generation.
 */

import { motion } from "framer-motion";
import type { UploadResponse } from "@/types/api";
import { uploadAPI } from "@/services/api";
import { APIError } from "@/lib/fetcher";

interface UploadSectionProps {
  text: string;
  setText: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  uploadInfo: UploadResponse | null;
  setUploadInfo: (info: UploadResponse | null) => void;
  uploading: boolean;
  setUploading: (val: boolean) => void;
  setError: (err: string | null) => void;
}

/**
 * Main UploadSection component
 * - Allows PDF upload or manual text input
 * - Handles sending files/text to backend
 * - Displays upload progress and results
 */
export default function UploadSection({
  text,
  setText,
  file,
  setFile,
  uploadInfo,
  setUploadInfo,
  uploading,
  setUploading,
  setError,
}: UploadSectionProps) {
  // Remove selected file and reset states
  const handleRemoveFile = () => {
    setFile(null);
    setUploadInfo(null);
    setError(null);
  };

  // Upload handler for PDFs or text input
  const handleUpload = async () => {
    // Prevent empty submissions
    if (!file && !text.trim()) {
      setError("Please select a PDF file or enter text");
      return;
    }

    // Reset states
    setError(null);
    setUploadInfo(null);
    setUploading(true);

    try {
      // Prepare multipart form for FastAPI
      const form = new FormData();
      if (file) form.append("file", file);
      if (text.trim()) form.append("text", text.trim());

      // Use the new API service
      const data = await uploadAPI.upload(form);

      // Success — store upload info
      setUploadInfo(data);

      // If a file was uploaded and text was extracted, replace text area content
      if (file && data.extracted_text) {
        setText(data.extracted_text);
      }
    } catch (error) {
      // Handle APIError with proper typing
      if (error instanceof APIError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Upload failed. Please try again.");
      }
    } finally {
      // Always turn off loading state
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
      <div className="space-y-3">
        {/* Upload Label */}
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Upload PDF Document
        </label>

        {/* Upload Input + Extract Button */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 dark:text-gray-300
                      file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 hover:file:text-blue-800
                      dark:file:bg-gray-700 dark:file:text-gray-300
                      dark:hover:file:bg-gray-600 dark:hover:file:text-gray-200
                      transition-all duration-200"
          />

          {/* Extract Text Button */}
          <motion.button
            type="button"
            onClick={handleUpload}
            disabled={uploading || (!file && !text.trim())}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white
                      rounded-lg font-medium hover:from-blue-600 hover:to-purple-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {uploading ? "Processing..." : "Extract Text"}
          </motion.button>
        </div>

        {/* Display selected file */}
        {file && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mt-2">
            <p className="text-sm truncate max-w-xs">{file.name}</p>
            <button
              onClick={handleRemoveFile}
              className="text-red-500 dark:text-red-400 hover:underline text-sm"
            >
              Remove
            </button>
          </div>
        )}

        {/* Show upload success info */}
        {uploadInfo && uploadInfo.file_info && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-2">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Successfully extracted text from PDF
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {uploadInfo.file_info.extracted_chars.toLocaleString()} characters extracted
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Textarea for direct text input or extracted text */}
        <div className="mt-4">
          <textarea
            className="w-full h-48 p-4 border border-gray-200 dark:border-gray-600
                      rounded-xl bg-gray-50 dark:bg-gray-700
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-500 dark:placeholder-gray-400
                      resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all duration-200"
            placeholder={
              uploadInfo && uploadInfo.file_info
                ? "Text extracted from PDF - you can edit before generating"
                : "Paste your educational content here..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}
