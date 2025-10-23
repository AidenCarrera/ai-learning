"use client";

import { useState } from "react";
import type { Flashcard, UploadResponse } from "@/types/api";
import UploadSection from "@/components/upload/UploadSection";
import FlashcardsView from "@/components/flashcards/FlashcardsView";
import GenerateButton from "@/components/GenerateButton";
import PageContainer from "@/components/layout/PageContainer";
import { flashcardAPI } from "@/services/api";
import { APIError } from "@/lib/fetcher";
import { useCardSets } from "@/contexts/CardSetsContext";
import { Save } from "lucide-react";

export default function GeneratePage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { createCardSet } = useCardSets();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFlashcards([]);
    setSaveSuccess(false);

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

  const handleSaveCardSet = () => {
    if (flashcards.length === 0) {
      setError("No flashcards to save");
      return;
    }

    // Generate a default name from the first few words of text
    const defaultName = text
      .slice(0, 50)
      .split(" ")
      .slice(0, 5)
      .join(" ")
      .concat("...");

    const name = prompt("Name your card set:", defaultName) || defaultName;

    createCardSet({
      name,
      mode: "flashcards",
      flashcards,
      sourceText: text,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
    <PageContainer
      title="Generate Flashcards"
      description="Transform any text or PDF into interactive flashcards for effective learning"
      action={
        flashcards.length > 0 && (
          <button
            onClick={handleSaveCardSet}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Save className="w-4 h-4" />
            Save Card Set
          </button>
        )
      }
    >
      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-medium">
            ✓ Card set saved successfully! View it in your{" "}
            <a href="/library" className="underline hover:text-green-900">
              Library
            </a>
          </p>
        </div>
      )}

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
    </PageContainer>
  );
}