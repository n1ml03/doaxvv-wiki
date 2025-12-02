/**
 * useQuizResults Hook Tests
 * Tests for quiz results loading and management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuizResults } from '../../../../src/features/quiz/hooks/useQuizResults';
import type { QuizResult } from '../../../../src/features/quiz/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useQuizResults', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const createMockResult = (id: string, quizId: string, userId: string): QuizResult => ({
    id,
    quizId,
    quizName: `Quiz ${quizId}`,
    userId,
    username: `User ${userId}`,
    score: 80,
    maxScore: 100,
    percentage: 80,
    correctCount: 8,
    totalQuestions: 10,
    timeTaken: 300,
    completedAt: new Date(),
    answers: [],
  });

  describe('initialization', () => {
    it('should initialize with empty results', () => {
      const { result } = renderHook(() => useQuizResults());

      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not load when enabled is false', () => {
      const { result } = renderHook(() =>
        useQuizResults({ enabled: false })
      );

      expect(result.current.results).toEqual([]);
    });
  });

  describe('saveQuizResult', () => {
    it('should save a quiz result', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult = createMockResult('result-1', 'quiz-1', 'user-1');

      act(() => {
        result.current.saveQuizResult(mockResult);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      expect(result.current.results[0].id).toBe('result-1');
    });

    it('should save multiple results', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult1 = createMockResult('result-1', 'quiz-1', 'user-1');
      const mockResult2 = createMockResult('result-2', 'quiz-2', 'user-1');

      act(() => {
        result.current.saveQuizResult(mockResult1);
      });

      act(() => {
        result.current.saveQuizResult(mockResult2);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });
    });
  });

  describe('filtering', () => {
    it('should filter results by quizId', async () => {
      const { result: allResults } = renderHook(() => useQuizResults());

      const mockResult1 = createMockResult('result-1', 'quiz-1', 'user-1');
      const mockResult2 = createMockResult('result-2', 'quiz-2', 'user-1');

      act(() => {
        allResults.current.saveQuizResult(mockResult1);
        allResults.current.saveQuizResult(mockResult2);
      });

      const { result: filteredResults } = renderHook(() =>
        useQuizResults({ quizId: 'quiz-1' })
      );

      await waitFor(() => {
        expect(filteredResults.current.results).toHaveLength(1);
        expect(filteredResults.current.results[0].quizId).toBe('quiz-1');
      });
    });

    it('should filter results by userId', async () => {
      const { result: allResults } = renderHook(() => useQuizResults());

      const mockResult1 = createMockResult('result-1', 'quiz-1', 'user-1');
      const mockResult2 = createMockResult('result-2', 'quiz-1', 'user-2');

      act(() => {
        allResults.current.saveQuizResult(mockResult1);
        allResults.current.saveQuizResult(mockResult2);
      });

      const { result: filteredResults } = renderHook(() =>
        useQuizResults({ userId: 'user-1' })
      );

      await waitFor(() => {
        expect(filteredResults.current.results).toHaveLength(1);
        expect(filteredResults.current.results[0].userId).toBe('user-1');
      });
    });
  });

  describe('removeResult', () => {
    it('should remove a result by ID', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult = createMockResult('result-1', 'quiz-1', 'user-1');

      act(() => {
        result.current.saveQuizResult(mockResult);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      act(() => {
        const success = result.current.removeResult('result-1');
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(0);
      });
    });

    it('should return false when removing non-existent result', () => {
      const { result } = renderHook(() => useQuizResults());

      act(() => {
        const success = result.current.removeResult('non-existent');
        expect(success).toBe(false);
      });
    });
  });

  describe('clearResults', () => {
    it('should clear all results', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult1 = createMockResult('result-1', 'quiz-1', 'user-1');
      const mockResult2 = createMockResult('result-2', 'quiz-2', 'user-1');

      act(() => {
        result.current.saveQuizResult(mockResult1);
        result.current.saveQuizResult(mockResult2);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });

      act(() => {
        result.current.clearResults();
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(0);
      });
    });
  });

  describe('getBestResultForQuiz', () => {
    it('should return the best result for a quiz and user', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult1: QuizResult = {
        ...createMockResult('result-1', 'quiz-1', 'user-1'),
        percentage: 70,
      };
      const mockResult2: QuizResult = {
        ...createMockResult('result-2', 'quiz-1', 'user-1'),
        percentage: 90,
      };

      act(() => {
        result.current.saveQuizResult(mockResult1);
        result.current.saveQuizResult(mockResult2);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });

      const best = result.current.getBestResultForQuiz('quiz-1', 'user-1');
      expect(best?.percentage).toBe(90);
    });

    it('should return null when no results found', () => {
      const { result } = renderHook(() => useQuizResults());

      const best = result.current.getBestResultForQuiz('non-existent', 'user-1');
      expect(best).toBeNull();
    });
  });

  describe('refetch', () => {
    it('should reload results from storage', async () => {
      const { result } = renderHook(() => useQuizResults());

      const mockResult = createMockResult('result-1', 'quiz-1', 'user-1');

      act(() => {
        result.current.saveQuizResult(mockResult);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock localStorage to return invalid JSON
      localStorageMock.getItem.mockImplementationOnce(() => 'invalid json');

      const { result } = renderHook(() => useQuizResults());

      // Should return empty results when storage is corrupted
      expect(result.current.results).toEqual([]);
    });
  });
});
