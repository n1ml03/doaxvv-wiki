/**
 * Quiz Service
 * Handles quiz data loading, filtering, and search functionality
 * Integrates with content loader pattern for CSV and markdown parsing
 */

import type { Quiz, Question, QuizFilters } from '../types';
import type { LocalizedString } from '@/shared/types/localization';
import { parseQuizCSV, getValidQuizzes } from '@/content/utils/quiz-parser';
import { parseQuestionMarkdown, getValidQuestions } from '@/content/utils/question-parser';

// Import quiz CSV as raw text
import quizzesCSV from '@/content/data/quizzes.csv?raw';

/**
 * Cache for loaded quizzes
 */
let quizzesCache: Quiz[] | null = null;

/**
 * Map for O(1) lookup by unique_key
 */
const quizzesByKey: Map<string, Quiz> = new Map();

/**
 * Load all quizzes from CSV
 * Uses caching to avoid re-parsing on subsequent calls
 */
export async function loadQuizzes(): Promise<Quiz[]> {
  if (quizzesCache) {
    return quizzesCache;
  }

  const result = parseQuizCSV(quizzesCSV);
  const quizzes = getValidQuizzes(result);

  // Build lookup map
  quizzesByKey.clear();
  for (const quiz of quizzes) {
    quizzesByKey.set(quiz.unique_key, quiz);
  }

  quizzesCache = quizzes;
  return quizzes;
}

/**
 * Get a quiz by its unique key
 * Returns undefined if not found
 */
export function getQuizByKey(uniqueKey: string): Quiz | undefined {
  return quizzesByKey.get(uniqueKey);
}

/**
 * Get a quiz by its unique key (async version that ensures data is loaded)
 */
export async function getQuizByKeyAsync(uniqueKey: string): Promise<Quiz | undefined> {
  await loadQuizzes();
  return quizzesByKey.get(uniqueKey);
}

/**
 * Load questions from a markdown file reference
 * @param questionsRef - Path to the markdown file (e.g., "quizzes/doax-basics.md")
 */
export async function loadQuestions(questionsRef: string): Promise<Question[]> {
  try {
    // Dynamic import of markdown files from the quizzes directory
    const modules = import.meta.glob('/src/content/data/quizzes/*.md', { 
      query: '?raw',
      import: 'default' 
    });
    
    // Normalize the path to match the glob pattern
    const normalizedPath = questionsRef.startsWith('quizzes/') 
      ? `/src/content/data/${questionsRef}`
      : `/src/content/data/quizzes/${questionsRef}`;
    
    const loader = modules[normalizedPath];
    
    if (!loader) {
      console.warn(`Question file not found: ${questionsRef}`);
      return [];
    }

    const markdownContent = await loader() as string;
    const result = parseQuestionMarkdown(markdownContent);
    return getValidQuestions(result);
  } catch (error) {
    console.error(`Failed to load questions from ${questionsRef}:`, error);
    return [];
  }
}

/**
 * Filter quizzes by category and/or difficulty
 * @param quizzes - Array of quizzes to filter
 * @param filters - Filter criteria
 */
export function filterQuizzes(quizzes: Quiz[], filters: QuizFilters): Quiz[] {
  return quizzes.filter(quiz => {
    // Filter by category
    if (filters.category && quiz.category !== filters.category) {
      return false;
    }

    // Filter by difficulty
    if (filters.difficulty && quiz.difficulty !== filters.difficulty) {
      return false;
    }

    // Filter by status
    if (filters.status && quiz.status !== filters.status) {
      return false;
    }

    return true;
  });
}

/**
 * Check if a localized string contains the search term (case-insensitive)
 */
function localizedStringContains(localizedString: LocalizedString, searchTerm: string): boolean {
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Check all language variants
  if (localizedString.en?.toLowerCase().includes(lowerSearchTerm)) return true;
  if (localizedString.jp?.toLowerCase().includes(lowerSearchTerm)) return true;
  if (localizedString.cn?.toLowerCase().includes(lowerSearchTerm)) return true;
  if (localizedString.tw?.toLowerCase().includes(lowerSearchTerm)) return true;
  if (localizedString.kr?.toLowerCase().includes(lowerSearchTerm)) return true;
  
  return false;
}

/**
 * Search quizzes by name across all localized strings
 * @param quizzes - Array of quizzes to search
 * @param searchTerm - Search term to match against quiz names
 */
export function searchQuizzes(quizzes: Quiz[], searchTerm: string): Quiz[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return quizzes;
  }

  const trimmedTerm = searchTerm.trim();
  
  return quizzes.filter(quiz => localizedStringContains(quiz.name, trimmedTerm));
}

/**
 * Clear the quiz cache (useful for testing or forcing reload)
 */
export function clearQuizCache(): void {
  quizzesCache = null;
  quizzesByKey.clear();
}

/**
 * Get all unique categories from quizzes
 */
export function getQuizCategories(quizzes: Quiz[]): string[] {
  const categories = new Set<string>();
  for (const quiz of quizzes) {
    if (quiz.category) {
      categories.add(quiz.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Get published quizzes only
 */
export function getPublishedQuizzes(quizzes: Quiz[]): Quiz[] {
  return quizzes.filter(quiz => quiz.status === 'published');
}
