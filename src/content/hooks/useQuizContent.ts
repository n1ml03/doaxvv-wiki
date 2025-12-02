/**
 * Hook for loading quiz question markdown content
 * 
 * Supports:
 * - Bundled markdown files (default)
 * - External files via setMarkdownBasePath() for Windows/Unix paths
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMarkdownContent,
  loadMarkdownContentAsync,
  getMarkdownLoaderConfig,
} from '../utils/markdown-loader';
import { parseQuestionMarkdown, getValidQuestions } from '../utils/question-parser';
import type { Question } from '@/features/quiz/types';

export interface UseQuizContentResult {
  /** Raw markdown content */
  rawContent: string | null;
  /** Parsed questions from the markdown */
  questions: Question[];
  /** Loading state */
  isLoading: boolean;
  /** Error if content couldn't be loaded */
  error: string | null;
  /** Reload the content */
  reload: () => void;
}

/**
 * Hook to load and parse quiz question markdown content
 * 
 * Usage:
 * ```tsx
 * // Default: loads from bundled files
 * const { questions, isLoading } = useQuizContent("quizzes/doax-basics.md");
 * ```
 * 
 * @param questionsRef - The questions_ref path (e.g., "quizzes/doax-basics.md")
 * @returns Object with content, questions, loading state, and error
 */
export function useQuizContent(
  questionsRef: string | undefined
): UseQuizContentResult {
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    if (!questionsRef) {
      setRawContent(null);
      setQuestions([]);
      setIsLoading(false);
      setError('No questions reference provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config = getMarkdownLoaderConfig();
      let content: string | null;

      // Use async loading if external files are configured
      if (config.useExternalFiles) {
        content = await loadMarkdownContentAsync(questionsRef);
      } else {
        content = getMarkdownContent(questionsRef);
      }

      if (content) {
        setRawContent(content);
        const result = parseQuestionMarkdown(content);
        setQuestions(getValidQuestions(result));
        setError(null);
      } else {
        setRawContent(null);
        setQuestions([]);
        setError(`Quiz content not found: ${questionsRef}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load quiz content'
      );
      setRawContent(null);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [questionsRef]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return {
    rawContent,
    questions,
    isLoading,
    error,
    reload: loadContent,
  };
}
