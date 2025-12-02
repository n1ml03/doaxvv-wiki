/**
 * useQuizResults Hook
 * Loads and manages quiz results from local storage
 * Requirements: 4.2, 4.4
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuizResult } from '../types';
import {
  loadResults,
  saveResult,
  getResultsByQuiz,
  getResultsByUser,
  getBestResult,
  deleteResult,
  clearAllResults,
} from '../services/result.service';

export interface UseQuizResultsOptions {
  /** Filter results by quiz ID */
  quizId?: string;
  /** Filter results by user ID */
  userId?: string;
  /** Whether to load data immediately (default: true) */
  enabled?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseQuizResultsResult {
  /** Quiz results (sorted by date, most recent first) */
  results: QuizResult[];
  /** Loading state */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Save a new quiz result */
  saveQuizResult: (result: QuizResult) => void;
  /** Delete a result by ID */
  removeResult: (resultId: string) => boolean;
  /** Clear all results */
  clearResults: () => void;
  /** Refetch results from storage */
  refetch: () => void;
  /** Get best result for a specific quiz and user */
  getBestResultForQuiz: (quizId: string, userId: string) => QuizResult | null;
}


/**
 * Hook for loading and managing quiz results
 * 
 * @example
 * ```tsx
 * // Load all results
 * const { results, saveQuizResult, isLoading } = useQuizResults();
 * 
 * // Load results for a specific quiz
 * const { results } = useQuizResults({ quizId: 'doax-basics' });
 * 
 * // Load results for a specific user
 * const { results } = useQuizResults({ userId: 'user-123' });
 * ```
 */
export function useQuizResults(options: UseQuizResultsOptions = {}): UseQuizResultsResult {
  const {
    quizId,
    userId,
    enabled = true,
    onError,
  } = options;

  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const loadData = useCallback(() => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      let loadedResults: QuizResult[];

      // Apply filters based on options
      if (quizId) {
        loadedResults = getResultsByQuiz(quizId);
      } else if (userId) {
        loadedResults = getResultsByUser(userId);
      } else {
        loadedResults = loadResults();
      }

      if (isMountedRef.current) {
        setResults(loadedResults);
        setIsLoading(false);
      }
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error(String(err));

      if (isMountedRef.current) {
        setError(loadError);
        setIsLoading(false);

        if (onError) {
          onError(loadError);
        }
      }
    }
  }, [enabled, quizId, userId, onError]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Save a new quiz result and refresh the list
   * Requirements: 4.2 - save QuizResult to local storage
   */
  const saveQuizResult = useCallback((result: QuizResult) => {
    try {
      saveResult(result);
      // Refresh the results list
      loadData();
    } catch (err) {
      const saveError = err instanceof Error ? err : new Error(String(err));
      setError(saveError);
      if (onError) {
        onError(saveError);
      }
    }
  }, [loadData, onError]);

  /**
   * Delete a result by ID and refresh the list
   */
  const removeResult = useCallback((resultId: string): boolean => {
    try {
      const success = deleteResult(resultId);
      if (success) {
        loadData();
      }
      return success;
    } catch (err) {
      const deleteError = err instanceof Error ? err : new Error(String(err));
      setError(deleteError);
      if (onError) {
        onError(deleteError);
      }
      return false;
    }
  }, [loadData, onError]);

  /**
   * Clear all results and refresh the list
   */
  const clearResults = useCallback(() => {
    try {
      clearAllResults();
      loadData();
    } catch (err) {
      const clearError = err instanceof Error ? err : new Error(String(err));
      setError(clearError);
      if (onError) {
        onError(clearError);
      }
    }
  }, [loadData, onError]);

  /**
   * Get the best result for a specific quiz and user
   */
  const getBestResultForQuiz = useCallback((targetQuizId: string, targetUserId: string): QuizResult | null => {
    return getBestResult(targetQuizId, targetUserId);
  }, []);

  return {
    results,
    isLoading,
    error,
    saveQuizResult,
    removeResult,
    clearResults,
    refetch: loadData,
    getBestResultForQuiz,
  };
}
