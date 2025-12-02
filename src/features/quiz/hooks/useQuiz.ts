/**
 * useQuiz Hook
 * Loads a single quiz by unique key along with its questions
 * Parses question markdown and provides complete quiz data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Quiz, Question } from '../types';
import { getQuizByKeyAsync, loadQuestions } from '../services/quiz.service';

export interface UseQuizOptions {
  /** Whether to load data immediately (default: true) */
  enabled?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseQuizResult {
  /** Quiz metadata */
  quiz: Quiz | null;
  /** Parsed questions from markdown */
  questions: Question[];
  /** Loading state */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Refetch quiz and questions */
  refetch: () => Promise<void>;
}

/**
 * Hook for loading a single quiz with its questions
 * 
 * @param uniqueKey - The unique_key of the quiz to load
 * @param options - Hook options
 * 
 * @example
 * ```tsx
 * const { quiz, questions, isLoading, error } = useQuiz('doax-basics-quiz');
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * if (!quiz) return <NotFound />;
 * 
 * return <QuizDisplay quiz={quiz} questions={questions} />;
 * ```
 */
export function useQuiz(
  uniqueKey: string | undefined,
  options: UseQuizOptions = {}
): UseQuizResult {
  const { enabled = true, onError } = options;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const loadData = useCallback(async () => {
    if (!enabled || !uniqueKey) {
      setQuiz(null);
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load quiz metadata
      const quizData = await getQuizByKeyAsync(uniqueKey);

      if (!quizData) {
        throw new Error(`Quiz not found: ${uniqueKey}`);
      }

      // Load questions from markdown
      const questionsData = await loadQuestions(quizData.questions_ref);

      if (isMountedRef.current) {
        setQuiz(quizData);
        setQuestions(questionsData);
        setIsLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (isMountedRef.current) {
        setError(error);
        setQuiz(null);
        setQuestions([]);
        setIsLoading(false);

        if (onError) {
          onError(error);
        }
      }
    }
  }, [enabled, uniqueKey, onError]);

  // Load data on mount or when uniqueKey changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    quiz,
    questions,
    isLoading,
    error,
    refetch,
  };
}
