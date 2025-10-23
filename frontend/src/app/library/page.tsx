"use client";

import PageContainer from "@/components/layout/PageContainer";
import { useCardSets } from "@/contexts/CardSetsContext";
import { Library as LibraryIcon } from "lucide-react";

export default function LibraryPage() {
  const { cardSets, loading } = useCardSets();

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
      description={`${cardSets.length} card sets saved`}
    >
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
          <a
            href="/generate"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Generate Cards
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardSets.map((set) => (
            <div
              key={set.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {set.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {set.mode} • Created {new Date(set.createdAt).toLocaleDateString()}
              </p>
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}