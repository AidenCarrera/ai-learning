"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Check,
} from "lucide-react";
import { useCardSets } from "@/contexts/CardSetsContext";
import type { Flashcard } from "@/types/api";

export default function StudyModePage() {
  const params = useParams();
  const router = useRouter();
  const { getCardSet } = useCardSets();
  
  const setId = params.setId as string;
  const cardSet = getCardSet(setId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

  // Load cards on mount
  useEffect(() => {
    if (!cardSet) {
      router.push("/library");
      return;
    }

    if (cardSet.mode === "flashcards" && cardSet.flashcards) {
      setCards(cardSet.flashcards);
    } else {
      // Handle quiz/test modes later
      router.push("/library");
    }
  }, [cardSet, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFlipped, currentIndex]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedCards(new Set());
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedCards(new Set());
  };

  const handleMarkComplete = () => {
    setCompletedCards(prev => new Set(prev).add(currentIndex));
    if (currentIndex < cards.length - 1) {
      handleNext();
    }
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  if (!cardSet || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const completedCount = completedCards.size;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Library</span>
          </button>

          {/* Card Set Name */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate max-w-md">
            {cardSet.name}
          </h1>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Shuffle cards"
            >
              <Shuffle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span>
              {completedCount} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Card Container */}
          <div
            className="relative h-[500px] cursor-pointer perspective-1000"
            onClick={toggleFlip}
          >
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                // Question Side
                <motion.div
                  key="question"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-600 p-12 flex flex-col justify-center"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">❓</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      Question
                    </h3>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentCard.question}
                    </p>
                  </div>
                  <div className="mt-auto text-center">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Click or press Space to reveal answer
                    </span>
                  </div>
                </motion.div>
              ) : (
                // Answer Side
                <motion.div
                  key="answer"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-600 p-12 flex flex-col justify-center"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">💡</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      Answer
                    </h3>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-col items-center gap-3">
                    {!completedCards.has(currentIndex) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Complete
                      </button>
                    )}
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Click to show question
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use arrow keys to navigate
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Space/Enter to flip
              </p>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Completion Message */}
          {currentIndex === cards.length - 1 && (
            <div className="mt-8 p-6 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-xl text-center">
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
                🎉 You&apos;ve reached the end!
              </h3>
              <p className="text-green-700 dark:text-green-400 mb-4">
                You completed {completedCount} out of {cards.length} cards
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={() => router.push("/library")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Back to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
              ←
            </kbd>
            <span>Previous</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
              →
            </kbd>
            <span>Next</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
              Space
            </kbd>
            <span>Flip Card</span>
          </div>
        </div>
      </div>
    </div>
  );
}