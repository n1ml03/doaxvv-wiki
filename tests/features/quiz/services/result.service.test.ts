/**
 * Result Service Tests
 * Tests for quiz result persistence using local storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  serializeUserAnswer,
  deserializeUserAnswer,
  serializeQuizResult,
  deserializeQuizResult,
  saveResult,
  loadResults,
  getResultsByQuiz,
  getResultsByUser,
  sortResultsByDate,
  getBestResult,
  deleteResult,
  clearAllResults,
  getResultCount,
} from '../../../../src/features/quiz/services/result.service';
import type { QuizResult, UserAnswer } from '../../../../src/features/quiz/types';

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

describe('Result Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('serializeUserAnswer', () => {
    it('should serialize UserAnswer with Date to ISO string', () => {
      const answer: UserAnswer = {
        questionId: 'q1',
        selectedOptions: ['opt1', 'opt2'],
        textAnswer: 'test answer',
        isCorrect: true,
        answeredAt: new Date('2024-01-15T10:30:00Z'),
        timeTaken: 45,
      };

      const serialized = serializeUserAnswer(answer);

      expect(serialized.questionId).toBe('q1');
      expect(serialized.selectedOptions).toEqual(['opt1', 'opt2']);
      expect(serialized.textAnswer).toBe('test answer');
      expect(serialized.isCorrect).toBe(true);
      expect(serialized.answeredAt).toBe('2024-01-15T10:30:00.000Z');
      expect(serialized.timeTaken).toBe(45);
    });

    it('should handle UserAnswer without textAnswer', () => {
      const answer: UserAnswer = {
        questionId: 'q1',
        selectedOptions: ['opt1'],
        isCorrect: false,
        answeredAt: new Date('2024-01-15T10:30:00Z'),
        timeTaken: 30,
      };

      const serialized = serializeUserAnswer(answer);

      expect(serialized.textAnswer).toBeUndefined();
    });
  });

  describe('deserializeUserAnswer', () => {
    it('should deserialize UserAnswer with ISO string to Date', () => {
      const serialized = {
        questionId: 'q1',
        selectedOptions: ['opt1', 'opt2'],
        textAnswer: 'test answer',
        isCorrect: true,
        answeredAt: '2024-01-15T10:30:00.000Z',
        timeTaken: 45,
      };

      const deserialized = deserializeUserAnswer(serialized);

      expect(deserialized.questionId).toBe('q1');
      expect(deserialized.selectedOptions).toEqual(['opt1', 'opt2']);
      expect(deserialized.textAnswer).toBe('test answer');
      expect(deserialized.isCorrect).toBe(true);
      expect(deserialized.answeredAt).toBeInstanceOf(Date);
      expect(deserialized.answeredAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      expect(deserialized.timeTaken).toBe(45);
    });
  });


  describe('serializeQuizResult', () => {
    it('should serialize QuizResult with all fields', () => {
      const result: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Test Quiz',
        userId: 'user-1',
        username: 'TestUser',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [
          {
            questionId: 'q1',
            selectedOptions: ['opt1'],
            isCorrect: true,
            answeredAt: new Date('2024-01-15T11:55:00Z'),
            timeTaken: 30,
          },
        ],
      };

      const serialized = serializeQuizResult(result);

      expect(serialized.id).toBe('result-1');
      expect(serialized.completedAt).toBe('2024-01-15T12:00:00.000Z');
      expect(serialized.answers[0].answeredAt).toBe('2024-01-15T11:55:00.000Z');
    });
  });

  describe('deserializeQuizResult', () => {
    it('should deserialize QuizResult with Date objects', () => {
      const serialized = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Test Quiz',
        userId: 'user-1',
        username: 'TestUser',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: '2024-01-15T12:00:00.000Z',
        answers: [
          {
            questionId: 'q1',
            selectedOptions: ['opt1'],
            isCorrect: true,
            answeredAt: '2024-01-15T11:55:00.000Z',
            timeTaken: 30,
          },
        ],
      };

      const deserialized = deserializeQuizResult(serialized);

      expect(deserialized.completedAt).toBeInstanceOf(Date);
      expect(deserialized.answers[0].answeredAt).toBeInstanceOf(Date);
    });
  });

  describe('saveResult and loadResults', () => {
    it('should save and load a quiz result', () => {
      const result: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Test Quiz',
        userId: 'user-1',
        username: 'TestUser',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      saveResult(result);
      const loaded = loadResults();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('result-1');
      expect(loaded[0].quizName).toBe('Test Quiz');
    });

    it('should save multiple results', () => {
      const result1: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      const result2: QuizResult = {
        id: 'result-2',
        quizId: 'quiz-2',
        quizName: 'Quiz 2',
        userId: 'user-1',
        username: 'User1',
        score: 90,
        maxScore: 100,
        percentage: 90,
        correctCount: 9,
        totalQuestions: 10,
        timeTaken: 250,
        completedAt: new Date('2024-01-16T12:00:00Z'),
        answers: [],
      };

      saveResult(result1);
      saveResult(result2);
      const loaded = loadResults();

      expect(loaded).toHaveLength(2);
    });
  });

  describe('getResultsByQuiz', () => {
    it('should filter results by quiz ID', () => {
      const result1: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      const result2: QuizResult = {
        id: 'result-2',
        quizId: 'quiz-2',
        quizName: 'Quiz 2',
        userId: 'user-1',
        username: 'User1',
        score: 90,
        maxScore: 100,
        percentage: 90,
        correctCount: 9,
        totalQuestions: 10,
        timeTaken: 250,
        completedAt: new Date('2024-01-16T12:00:00Z'),
        answers: [],
      };

      saveResult(result1);
      saveResult(result2);

      const quiz1Results = getResultsByQuiz('quiz-1');
      expect(quiz1Results).toHaveLength(1);
      expect(quiz1Results[0].quizId).toBe('quiz-1');
    });
  });

  describe('getResultsByUser', () => {
    it('should filter results by user ID', () => {
      const result1: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      const result2: QuizResult = {
        id: 'result-2',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-2',
        username: 'User2',
        score: 70,
        maxScore: 100,
        percentage: 70,
        correctCount: 7,
        totalQuestions: 10,
        timeTaken: 350,
        completedAt: new Date('2024-01-16T12:00:00Z'),
        answers: [],
      };

      saveResult(result1);
      saveResult(result2);

      const user1Results = getResultsByUser('user-1');
      expect(user1Results).toHaveLength(1);
      expect(user1Results[0].userId).toBe('user-1');
    });
  });

  describe('sortResultsByDate', () => {
    it('should sort results by date in descending order', () => {
      const results: QuizResult[] = [
        {
          id: 'result-1',
          quizId: 'quiz-1',
          quizName: 'Quiz 1',
          userId: 'user-1',
          username: 'User1',
          score: 80,
          maxScore: 100,
          percentage: 80,
          correctCount: 8,
          totalQuestions: 10,
          timeTaken: 300,
          completedAt: new Date('2024-01-15T12:00:00Z'),
          answers: [],
        },
        {
          id: 'result-2',
          quizId: 'quiz-1',
          quizName: 'Quiz 1',
          userId: 'user-1',
          username: 'User1',
          score: 90,
          maxScore: 100,
          percentage: 90,
          correctCount: 9,
          totalQuestions: 10,
          timeTaken: 250,
          completedAt: new Date('2024-01-17T12:00:00Z'),
          answers: [],
        },
        {
          id: 'result-3',
          quizId: 'quiz-1',
          quizName: 'Quiz 1',
          userId: 'user-1',
          username: 'User1',
          score: 70,
          maxScore: 100,
          percentage: 70,
          correctCount: 7,
          totalQuestions: 10,
          timeTaken: 350,
          completedAt: new Date('2024-01-16T12:00:00Z'),
          answers: [],
        },
      ];

      const sorted = sortResultsByDate(results);

      expect(sorted[0].id).toBe('result-2'); // Most recent
      expect(sorted[1].id).toBe('result-3');
      expect(sorted[2].id).toBe('result-1'); // Oldest
    });
  });

  describe('getBestResult', () => {
    it('should return the best result for a quiz and user', () => {
      const result1: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      const result2: QuizResult = {
        id: 'result-2',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 95,
        maxScore: 100,
        percentage: 95,
        correctCount: 9,
        totalQuestions: 10,
        timeTaken: 250,
        completedAt: new Date('2024-01-16T12:00:00Z'),
        answers: [],
      };

      saveResult(result1);
      saveResult(result2);

      const best = getBestResult('quiz-1', 'user-1');
      expect(best?.percentage).toBe(95);
    });

    it('should return null if no results found', () => {
      const best = getBestResult('nonexistent-quiz', 'user-1');
      expect(best).toBeNull();
    });
  });

  describe('deleteResult', () => {
    it('should delete a result by ID', () => {
      const result: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      saveResult(result);
      expect(loadResults()).toHaveLength(1);

      const deleted = deleteResult('result-1');
      expect(deleted).toBe(true);
      expect(loadResults()).toHaveLength(0);
    });

    it('should return false if result not found', () => {
      const deleted = deleteResult('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clearAllResults', () => {
    it('should clear all results from storage', () => {
      const result: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      saveResult(result);
      expect(loadResults()).toHaveLength(1);

      clearAllResults();
      expect(loadResults()).toHaveLength(0);
    });
  });

  describe('getResultCount', () => {
    it('should return the count of stored results', () => {
      expect(getResultCount()).toBe(0);

      const result: QuizResult = {
        id: 'result-1',
        quizId: 'quiz-1',
        quizName: 'Quiz 1',
        userId: 'user-1',
        username: 'User1',
        score: 80,
        maxScore: 100,
        percentage: 80,
        correctCount: 8,
        totalQuestions: 10,
        timeTaken: 300,
        completedAt: new Date('2024-01-15T12:00:00Z'),
        answers: [],
      };

      saveResult(result);
      expect(getResultCount()).toBe(1);
    });
  });
});
