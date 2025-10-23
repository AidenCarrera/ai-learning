"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Flashcard,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  GenerationMode,
} from "@/types/api";

// ============================================
// Types
// ============================================

export interface CardSet {
  id: string;
  name: string;
  mode: GenerationMode;
  createdAt: string;
  updatedAt: string;
  flashcards?: Flashcard[];
  quizQuestions?: MultipleChoiceQuestion[];
  testData?: {
    multiple_choice: MultipleChoiceQuestion[];
    true_false: TrueFalseQuestion[];
    short_answer: ShortAnswerQuestion[];
  };
  sourceText?: string;
  tags?: string[];
}

interface CardSetsContextType {
  cardSets: CardSet[];
  loading: boolean;
  
  // CRUD operations
  createCardSet: (cardSet: Omit<CardSet, "id" | "createdAt" | "updatedAt">) => CardSet;
  updateCardSet: (id: string, updates: Partial<CardSet>) => void;
  deleteCardSet: (id: string) => void;
  getCardSet: (id: string) => CardSet | undefined;
  
  // Utility
  searchCardSets: (query: string) => CardSet[];
  getRecentCardSets: (limit?: number) => CardSet[];
}

// ============================================
// Context
// ============================================

const CardSetsContext = createContext<CardSetsContextType | undefined>(undefined);

const STORAGE_KEY = "ai-learning-card-sets";

// ============================================
// Provider
// ============================================

export function CardSetsProvider({ children }: { children: ReactNode }) {
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCardSets(parsed);
      }
    } catch (error) {
      console.error("Failed to load card sets from storage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever cardSets change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cardSets));
      } catch (error) {
        console.error("Failed to save card sets to storage:", error);
      }
    }
  }, [cardSets, loading]);

  // Create new card set
  const createCardSet = (cardSet: Omit<CardSet, "id" | "createdAt" | "updatedAt">): CardSet => {
    const newCardSet: CardSet = {
      ...cardSet,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCardSets((prev) => [newCardSet, ...prev]);
    return newCardSet;
  };

  // Update existing card set
  const updateCardSet = (id: string, updates: Partial<CardSet>) => {
    setCardSets((prev) =>
      prev.map((set) =>
        set.id === id
          ? { ...set, ...updates, updatedAt: new Date().toISOString() }
          : set
      )
    );
  };

  // Delete card set
  const deleteCardSet = (id: string) => {
    setCardSets((prev) => prev.filter((set) => set.id !== id));
  };

  // Get single card set by ID
  const getCardSet = (id: string): CardSet | undefined => {
    return cardSets.find((set) => set.id === id);
  };

  // Search card sets by name or tags
  const searchCardSets = (query: string): CardSet[] => {
    const lowerQuery = query.toLowerCase();
    return cardSets.filter(
      (set) =>
        set.name.toLowerCase().includes(lowerQuery) ||
        set.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  };

  // Get most recent card sets
  const getRecentCardSets = (limit: number = 5): CardSet[] => {
    return [...cardSets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  };

  const value: CardSetsContextType = {
    cardSets,
    loading,
    createCardSet,
    updateCardSet,
    deleteCardSet,
    getCardSet,
    searchCardSets,
    getRecentCardSets,
  };

  return (
    <CardSetsContext.Provider value={value}>
      {children}
    </CardSetsContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useCardSets() {
  const context = useContext(CardSetsContext);
  if (context === undefined) {
    throw new Error("useCardSets must be used within a CardSetsProvider");
  }
  return context;
}