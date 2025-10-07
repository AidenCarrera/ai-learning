"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GenerateResponse, UploadResponse, Flashcard } from "../types/api";
import FlashcardsView from "../components/FlashcardsView";

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file && !text.trim()) {
      setError("Please select a PDF file or enter text");
      return;
    }

    setError(null);
    setUploadInfo(null);
    setUploading(true);
    
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (text.trim()) form.append("text", text.trim());
      
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: form,
      });
      
      const data = (await res.json()) as UploadResponse | { error?: string };
      if ("error" in data && data.error) throw new Error(data.error);
      
      setUploadInfo(data as UploadResponse);
      
      // If we uploaded a file, populate the text area with extracted content
      if (file && (data as UploadResponse).extracted_text) {
        setText((data as UploadResponse).extracted_text);
      }
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFlashcards([]);
    
    try {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "flashcards" }),
      });
      const data = (await res.json()) as GenerateResponse | { error?: string };
      if ("error" in data && data.error) throw new Error(data.error);
      
      // Convert FlashcardItem[] to Flashcard[] with unique IDs
      const generatedCards = (data as GenerateResponse).flashcards || [];
      const cardsWithIds: Flashcard[] = generatedCards.map((card, index) => ({
        id: `card-${Date.now()}-${index}`,
        question: card.question,
        answer: card.answer,
      }));
      
      setFlashcards(cardsWithIds);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateFlashcard = (id: string, question: string, answer: string) => {
    setFlashcards(prev => prev.map(card => 
      card.id === id ? { ...card, question, answer } : card
    ));
  };

  const handleDeleteFlashcard = (id: string) => {
    setFlashcards(prev => prev.filter(card => card.id !== id));
  };

  const handleReorderFlashcards = (fromIndex: number, toIndex: number) => {
    setFlashcards(prev => {
      const newCards = [...prev];
      const [movedCard] = newCards.splice(fromIndex, 1);
      newCards.splice(toIndex, 0, movedCard);
      return newCards;
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadInfo(null);
    setError(null);
    // Don't clear text area - user might want to keep extracted text
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            AI Learning Flashcards
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform any text or PDF into interactive flashcards for effective learning
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Upload PDF Document
              </label>
              
              {/* File Input Area */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 hover:file:text-blue-800 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600 dark:hover:file:text-gray-200 transition-all duration-200"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  <motion.button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || (!file && !text.trim())}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Extract Text"
                    )}
                  </motion.button>
                </div>
                
                {/* Selected File Display with Remove Button */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleRemoveFile}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </motion.div>
                )}
              </div>
              
              {/* Upload Success Info */}
              {uploadInfo && uploadInfo.file_info && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">PDF processed successfully!</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Extracted {uploadInfo.extracted_text.length.toLocaleString()} characters • {uploadInfo.chunks.length} chunk(s)
                  </div>
                </motion.div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {uploadInfo && uploadInfo.file_info ? "Extracted Text (editable)" : "Or paste your text here"}
              </label>
              <div className="relative">
                <textarea
                  className="w-full h-48 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                  placeholder={uploadInfo && uploadInfo.file_info ? "Text extracted from PDF - you can edit this before generating flashcards" : "Paste your educational content here..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {text && (
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {text.length.toLocaleString()} characters
                  </div>
                )}
              </div>
              {uploadInfo && uploadInfo.file_info && (
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  💡 You can edit the extracted text above before generating flashcards. Remove any unwanted content or add additional context.
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="flex items-center justify-between">
              <motion.button
                type="submit"
                disabled={loading || (!text.trim() && !file)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Generate Flashcards"
                )}
              </motion.button>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-200 dark:border-red-800"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </form>
        </div>

        {/* Flashcards Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FlashcardsView
            flashcards={flashcards}
            onUpdate={handleUpdateFlashcard}
            onDelete={handleDeleteFlashcard}
            onReorder={handleReorderFlashcards}
          />
        </motion.div>
      </div>
    </div>
  );
}