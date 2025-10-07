"use client";

import { useState } from "react";
import type { GenerateResponse, UploadResponse } from "../types/api";

interface Flashcard {
  question: string;
  answer: string;
}

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  async function handleUpload() {
    setError(null);
    setUploadInfo(null);
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
      if (!text && (data as UploadResponse).extracted_text) {
        setText((data as UploadResponse).extracted_text);
      }
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFlashcards([]);
    setFlippedCards(new Set());
    
    try {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "flashcards" }),
      });
      const data = (await res.json()) as GenerateResponse | { error?: string };
      if ("error" in data && data.error) throw new Error(data.error);
      setFlashcards((data as GenerateResponse).flashcards || []);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const toggleCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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
              <div className="flex items-center gap-4">
                <input
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={handleUpload}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Extract Text
                </button>
              </div>
              {uploadInfo && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  ✓ Extracted {uploadInfo.extracted_text.length} characters • {uploadInfo.chunks.length} chunks
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Or paste your text here
              </label>
              <textarea
                className="w-full h-32 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                placeholder="Paste your educational content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading || (!text.trim() && !file)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Flashcards"
                )}
              </button>
              {error && (
                <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Flashcards Display */}
        {flashcards.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Your Flashcards
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Click on any card to reveal the answer
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashcards.map((card, index) => (
                <div
                  key={index}
                  className="group cursor-pointer"
                  onClick={() => toggleCard(index)}
                >
                  <div className="relative h-64 w-full perspective-1000">
                    <div
                      className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                        flippedCards.has(index) ? "rotate-y-180" : ""
                      }`}
                    >
                      {/* Front of card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-6 flex flex-col justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❓</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Question
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {card.question}
                          </p>
                        </div>
                        <div className="mt-auto text-center">
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Click to reveal answer
                          </span>
                        </div>
                      </div>

                      {/* Back of card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-6 flex flex-col justify-center rotate-y-180">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💡</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Answer
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {card.answer}
                          </p>
                        </div>
                        <div className="mt-auto text-center">
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Click to flip back
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}