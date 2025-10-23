"use client";

import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import { useCardSets } from "@/contexts/CardSetsContext";
import { PlusCircle, Library, Sparkles } from "lucide-react";

export default function HomePage() {
  const { cardSets, getRecentCardSets } = useCardSets();
  const recentSets = getRecentCardSets(3);

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            AI-Powered Learning
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Turn your notes into
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            smart flashcards
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Transform any text or PDF into interactive flashcards, quizzes, and tests in seconds
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <PlusCircle className="w-5 h-5" />
            Generate New Cards
          </Link>
          
          {cardSets.length > 0 && (
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
            >
              <Library className="w-5 h-5" />
              View Library
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {cardSets.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Card Sets</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {cardSets.reduce((acc, set) => {
              if (set.flashcards) return acc + set.flashcards.length;
              if (set.quizQuestions) return acc + set.quizQuestions.length;
              return acc;
            }, 0)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Cards</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {recentSets.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Recent Sets</div>
        </div>
      </div>

      {/* Recent Sets */}
      {recentSets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Recent Sets
            </h2>
            <Link
              href="/library"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSets.map((set) => (
              <Link
                key={set.id}
                href={`/library/${set.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {set.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    {set.mode}
                  </span>
                  <span>•</span>
                  <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}