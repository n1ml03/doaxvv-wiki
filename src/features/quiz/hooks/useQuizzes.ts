/**
 * useQuizzes Hook
 * Loads and manages quiz data with filtering and search capabilities
 * Follows the react-query pattern used in other content hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Quiz, QuizFilters } from '../types';
import { 
  loadQuizzes, 
  filterQuizzes, 
  searchQuizzes,
  getPublishedQuizzes,
} from '../services/quiz.service';

export interface UseQuizzesOptions {
  /** Whether to load data immediately (default: true) */
  enabled?: boolean;
  /** Only return published quizzes (default: true) */
  publishedOnly?: boolean;
  /** Initial filters to apply */
  initialFilters?: QuizFilters;
  /** Initial search term */
  initialSearchTerm?: string;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseQuizzesResult {
  /** All loaded quizzes (before filtering) */
  data: Quiz[] | undefined;
  /** Filtered and searched quizzes */
  filteredData: Quiz[];
  /** Loading state */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Refetch quizzes */
  refetch: () => Promise<void>;
  /** Current filters */
  filters: QuizFilters;
  /** Update filters */
  setFilters: (filters: QuizFilters) => void;
  /** Current search term */
  searchTerm: string;
  /** Update search term */
  setSearchTerm: (term: string) => void;
  /** Available categories from loaded quizzes */
  categories: string[];
}

/**
 * Hook for loading and managing quiz data
 * 
 * @example
 * ```tsx
 * const { filteredData, isLoading, setFilters, setSearchTerm } = useQuizzes();
 * 
 * // Filter by difficulty
 * setFilters({ difficulty: 'Easy' });
 * 
 * // Search by name
 * setSearchTerm('basics');
 * ```
 */
export function useQuizzes(options: UseQuizzesOptions = {}): UseQuizzesResult {
  const {
    enabled = true,
    publishedOnly = true,
    initialFilters = {},
    initialSearchTerm = '',
    onError,
  } = options;

  const [data, setData] = useState<Quiz[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<QuizFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);

  const isMountedRef = useRef<boolean>(true);

  const loadData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      let quizzes = await loadQuizzes();

      // Filter to published only if requested
      if (publishedOnly) {
        quizzes = getPublishedQuizzes(quizzes);
      }

      if (isMountedRef.current) {
        setData(quizzes);
        setIsLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (isMountedRef.current) {
        setError(error);
        setIsLoading(false);

        if (onError) {
          onError(error);
        }
      }
    }
  }, [enabled, publishedOnly, onError]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute filtered data
  const filteredData = useCallback(() => {
    if (!data) return [];

    let result = data;

    // Apply filters
    if (filters.category || filters.difficulty || filters.status) {
      result = filterQuizzes(result, filters);
    }

    // Apply search
    if (searchTerm) {
      result = searchQuizzes(result, searchTerm);
    }

    return result;
  }, [data, filters, searchTerm]);

  // Extract unique categories
  const categories = useCallback(() => {
    if (!data) return [];
    const categorySet = new Set<string>();
    for (const quiz of data) {
      if (quiz.category) {
        categorySet.add(quiz.category);
      }
    }
    return Array.from(categorySet).sort();
  }, [data]);

  const refetch = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    data,
    filteredData: filteredData(),
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    categories: categories(),
  };
}
