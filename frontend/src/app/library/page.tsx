"use client";

import Link from "next/link";
import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { useCardSets } from "@/contexts/CardSetsContext";
import { Library as LibraryIcon, Search, Trash2, Play, Calendar } from "lucide-react";

export default function LibraryPage() {
  const { cardSets, loading, deleteCardSet } = useCardSets();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter card sets based on search
  const filteredSets = cardSets.filter((set) =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteCardSet(id);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Library"
      description={`${cardSets.length} card set${cardSets.length !== 1 ? 's' : ''} saved`}
    >
      {/* Search Bar */}
      {cardSets.length > 0 && (
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search card sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {cardSets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <LibraryIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            No card sets yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first set to get started
          </p>
          <Link
            href="/generate"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            Generate Cards
          </Link>
        </div>
      ) : filteredSets.length === 0 ? (
        // No Search Results
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            No results found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try a different search term
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        // Card Sets Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => {
            const cardCount = set.flashcards?.length || 
                            set.quizQuestions?.length || 
                            (set.testData ? 
                              set.testData.multiple_choice.length + 
                              set.testData.true_false.length + 
                              set.testData.short_answer.length 
                              : 0);

            return (
              <div
                key={set.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
              >
                {/* Card Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {set.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium">
                      {set.mode}
                    </span>
                    <span>•</span>
                    <span>{cardCount} cards</span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(set.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/library/${set.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md group-hover:shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    Study
                  </Link>
                  <button
                    onClick={() => handleDelete(set.id, set.name)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                    title="Delete card set"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}