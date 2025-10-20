"use client";

import { motion } from "framer-motion";

interface GenerateButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: (e: React.FormEvent) => void;
  error: string | null;
}

export default function GenerateButton({ loading, disabled, onClick, error }: GenerateButtonProps) {
  return (
    <div className="flex items-center justify-between">
      <motion.button
        type="submit"
        disabled={disabled || loading}
        onClick={onClick}
        className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {loading ? "Generating..." : "Generate Flashcards"}
      </motion.button>
      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
