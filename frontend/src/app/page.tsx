"use client";

import { useState } from "react";
import type { Flashcard, UploadResponse } from "@/types/api";
import UploadSection from "@/components/upload/UploadSection";
import FlashcardsView from "@/components/flashcards/FlashcardsView";
import GenerateButton from "@/components/GenerateButton";
import { flashcardAPI } from "@/services/api";
import { APIError } from "@/lib/fetcher";

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFlashcards([]);

    try {
      // Use the new API service
      const data = await flashcardAPI.generate(text);

      // Transform API response to include client-side IDs
      const cardsWithIds: Flashcard[] = data.flashcards.map((card, index) => ({
        id: `card-${Date.now()}-${index}`,
        question: card.question,
        answer: card.answer,
      }));

      setFlashcards(cardsWithIds);
    } catch (error) {
      // Handle APIError with proper typing
      if (error instanceof APIError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to generate flashcards. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlashcard = (id: string, question: string, answer: string) =>
    setFlashcards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, question, answer } : card))
    );

  const handleDeleteFlashcard = (id: string) =>
    setFlashcards((prev) => prev.filter((card) => card.id !== id));

  const handleReorderFlashcards = (fromIndex: number, toIndex: number) => {
    setFlashcards((prev) => {
      const newCards = [...prev];
      const [movedCard] = newCards.splice(fromIndex, 1);
      newCards.splice(toIndex, 0, movedCard);
      return newCards;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="mx-auto w-[95vw] lg:w-[90vw] max-w-[1600px] px-6 py-10">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              AI Learning Flashcards
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform any text or PDF into interactive flashcards for effective learning
            </p>
          </div>

          <UploadSection
            text={text}
            setText={setText}
            file={file}
            setFile={setFile}
            uploadInfo={uploadInfo}
            setUploadInfo={setUploadInfo}
            uploading={uploading}
            setUploading={setUploading}
            setError={setError}
          />

          <form onSubmit={handleGenerate} className="mb-8">
            <GenerateButton
              loading={loading}
              disabled={!text.trim() && !file}
              onClick={handleGenerate}
              error={error}
            />
          </form>

          <FlashcardsView
            flashcards={flashcards}
            onUpdate={handleUpdateFlashcard}
            onDelete={handleDeleteFlashcard}
            onReorder={handleReorderFlashcards}
          />
        </div>
      </main>
    </div>
  );
}