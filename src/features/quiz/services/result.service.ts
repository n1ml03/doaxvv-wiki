/**
 * Result Storage Service
 * Manages quiz result persistence using local storage with JSON serialization
 * Requirements: 4.2, 4.4, 4.5, 4.6
 */

import type { QuizResult, UserAnswer } from '../types';

const STORAGE_KEY = 'quiz_results';

/**
 * Serialized format for UserAnswer (dates as ISO strings)
 */
interface SerializedUserAnswer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  isCorrect: boolean;
  answeredAt: string; // ISO date string
  timeTaken: number;
}

/**
 * Serialized format for QuizResult (dates as ISO strings)
 */
interface SerializedQuizResult {
  id: string;
  quizId: string;
  quizName: string;
  userId: string;
  username: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: string; // ISO date string
  answers: SerializedUserAnswer[];
}

/**
 * Storage structure for local storage
 */
interface QuizResultStorage {
  quizResults: SerializedQuizResult[];
}


/**
 * Serialize a UserAnswer to JSON-compatible format
 * Requirements: 4.5 - serialize to JSON format
 */
export function serializeUserAnswer(answer: UserAnswer): SerializedUserAnswer {
  return {
    questionId: answer.questionId,
    selectedOptions: answer.selectedOptions,
    textAnswer: answer.textAnswer,
    isCorrect: answer.isCorrect,
    answeredAt: answer.answeredAt.toISOString(),
    timeTaken: answer.timeTaken,
  };
}

/**
 * Deserialize a UserAnswer from JSON format
 * Requirements: 4.6 - deserialize JSON back to objects
 */
export function deserializeUserAnswer(serialized: SerializedUserAnswer): UserAnswer {
  return {
    questionId: serialized.questionId,
    selectedOptions: serialized.selectedOptions,
    textAnswer: serialized.textAnswer,
    isCorrect: serialized.isCorrect,
    answeredAt: new Date(serialized.answeredAt),
    timeTaken: serialized.timeTaken,
  };
}

/**
 * Serialize a QuizResult to JSON-compatible format
 * Requirements: 4.5 - serialize QuizResult to JSON format
 */
export function serializeQuizResult(result: QuizResult): SerializedQuizResult {
  return {
    id: result.id,
    quizId: result.quizId,
    quizName: result.quizName,
    userId: result.userId,
    username: result.username,
    score: result.score,
    maxScore: result.maxScore,
    percentage: result.percentage,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    timeTaken: result.timeTaken,
    completedAt: result.completedAt.toISOString(),
    answers: result.answers.map(serializeUserAnswer),
  };
}

/**
 * Deserialize a QuizResult from JSON format
 * Requirements: 4.6 - deserialize JSON back to QuizResult objects
 */
export function deserializeQuizResult(serialized: SerializedQuizResult): QuizResult {
  return {
    id: serialized.id,
    quizId: serialized.quizId,
    quizName: serialized.quizName,
    userId: serialized.userId,
    username: serialized.username,
    score: serialized.score,
    maxScore: serialized.maxScore,
    percentage: serialized.percentage,
    correctCount: serialized.correctCount,
    totalQuestions: serialized.totalQuestions,
    timeTaken: serialized.timeTaken,
    completedAt: new Date(serialized.completedAt),
    answers: serialized.answers.map(deserializeUserAnswer),
  };
}


/**
 * Load raw storage data from local storage
 */
function loadStorageData(): QuizResultStorage {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { quizResults: [] };
    }
    return JSON.parse(data) as QuizResultStorage;
  } catch {
    console.error('Failed to load quiz results from storage');
    return { quizResults: [] };
  }
}

/**
 * Save storage data to local storage
 */
function saveStorageData(storage: QuizResultStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Failed to save quiz results to storage:', error);
    // Handle quota exceeded by removing oldest results
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const trimmedStorage = {
        quizResults: storage.quizResults.slice(-50), // Keep only last 50 results
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedStorage));
    }
  }
}

/**
 * Save a quiz result to local storage
 * Requirements: 4.2 - save QuizResult to local storage with timestamp, score, time taken
 */
export function saveResult(result: QuizResult): void {
  const storage = loadStorageData();
  const serialized = serializeQuizResult(result);
  storage.quizResults.push(serialized);
  saveStorageData(storage);
}

/**
 * Load all quiz results from local storage
 * Requirements: 4.4 - display all past QuizResults sorted by date (descending)
 */
export function loadResults(): QuizResult[] {
  const storage = loadStorageData();
  const results = storage.quizResults.map(deserializeQuizResult);
  // Sort by completedAt in descending order (most recent first)
  return sortResultsByDate(results);
}

/**
 * Get quiz results filtered by quiz ID
 * Requirements: 4.2 - retrieve results for a specific quiz
 */
export function getResultsByQuiz(quizId: string): QuizResult[] {
  const allResults = loadResults();
  return allResults.filter(result => result.quizId === quizId);
}

/**
 * Get quiz results filtered by user ID
 */
export function getResultsByUser(userId: string): QuizResult[] {
  const allResults = loadResults();
  return allResults.filter(result => result.userId === userId);
}

/**
 * Sort results by completedAt in descending order (most recent first)
 * Requirements: 4.4 - display all past QuizResults sorted by date
 */
export function sortResultsByDate(results: QuizResult[]): QuizResult[] {
  return [...results].sort((a, b) => 
    b.completedAt.getTime() - a.completedAt.getTime()
  );
}

/**
 * Get the best result for a specific quiz by a user
 */
export function getBestResult(quizId: string, userId: string): QuizResult | null {
  const quizResults = getResultsByQuiz(quizId).filter(r => r.userId === userId);
  if (quizResults.length === 0) {
    return null;
  }
  return quizResults.reduce((best, current) => 
    current.percentage > best.percentage ? current : best
  );
}

/**
 * Delete a specific result by ID
 */
export function deleteResult(resultId: string): boolean {
  const storage = loadStorageData();
  const initialLength = storage.quizResults.length;
  storage.quizResults = storage.quizResults.filter(r => r.id !== resultId);
  
  if (storage.quizResults.length < initialLength) {
    saveStorageData(storage);
    return true;
  }
  return false;
}

/**
 * Clear all quiz results from storage
 */
export function clearAllResults(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get total number of stored results
 */
export function getResultCount(): number {
  const storage = loadStorageData();
  return storage.quizResults.length;
}
