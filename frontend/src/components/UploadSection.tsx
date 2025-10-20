"use client";

/**
 * UploadSection.tsx
 *
 * Handles uploading a PDF or entering text manually.
 * Sends the content to the FastAPI backend for text extraction,
 * then updates the app state with extracted text for flashcard generation.
 */

import { motion } from "framer-motion"; // For button animations
import type { UploadResponse } from "../types/api";

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

      // Send to backend API
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as UploadResponse | { error?: string };

      // Handle backend-side errors
      if ("error" in data && data.error) throw new Error(data.error);

      // Success — store upload info
      setUploadInfo(data as UploadResponse);

      // If a file was uploaded and text was extracted, replace text area content
      if (file && (data as UploadResponse).extracted_text) {
        setText((data as UploadResponse).extracted_text);
      }
    } catch (e: unknown) {
      // Type-safe error handling
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Upload failed");
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

        {/* Textarea for direct text input or extracted text */}
        <div className="mt-4">
          <textarea
            className="w-full h-48 p-4 border border-gray-200 dark:border-gray-600
                      rounded-xl bg-gray-50 dark:bg-gray-700
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-500 dark:placeholder-gray-400
                      resize-none"
            placeholder={
              uploadInfo && uploadInfo.file_info
                ? "Text extracted from PDF - you can edit before generating"
                : "Paste your educational content here..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
