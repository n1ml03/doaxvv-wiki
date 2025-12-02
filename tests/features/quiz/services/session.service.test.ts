/**
 * Session Service Tests
 * Tests for quiz session management, answer validation, and scoring
 */

import { describe, it, expect } from 'vitest';
import {
  createSession,
  validateSingleChoice,
  validateMultipleChoice,
  validateTextInput,
  validateAnswer,
  submitAnswer,
  calculateScore,
  calculateMaxScore,
  calculateCorrectCount,
  calculateTimeTaken,
  completeSession,
  timeoutSession,
  markSessionCompleted,
  updateTimeRemaining,
  hasMoreQuestions,
  getCurrentQuestionIndex,
} from '../../../../src/features/quiz/services/session.service';
import type { Question, QuizSession } from '../../../../src/features/quiz/types';

describe('Session Service', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'single_choice',
      content: 'What is 2 + 2?',
      options: [
        { id: 'opt1', text: '3', isCorrect: false },
        { id: 'opt2', text: '4', isCorrect: true },
        { id: 'opt3', text: '5', isCorrect: false },
      ],
      points: 10,
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      content: 'Select all prime numbers',
      options: [
        { id: 'opt1', text: '2', isCorrect: true },
        { id: 'opt2', text: '3', isCorrect: true },
        { id: 'opt3', text: '4', isCorrect: false },
        { id: 'opt4', text: '5', isCorrect: true },
      ],
      points: 20,
    },
    {
      id: 'q3',
      type: 'text_input',
      content: 'What is the capital of France?',
      options: [],
      correctAnswer: 'Paris',
      points: 15,
    },
  ];

  describe('createSession', () => {
    it('should create a new session with correct initial state', () => {
      const session = createSession('quiz-1', mockQuestions, 300);

      expect(session.id).toMatch(/^session-/);
      expect(session.quizId).toBe('quiz-1');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.answers).toHaveLength(0);
      expect(session.timeRemaining).toBe(300);
      expect(session.status).toBe('in_progress');
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it('should create session with no time limit', () => {
      const session = createSession('quiz-1', mockQuestions, 0);
      expect(session.timeRemaining).toBe(0);
    });
  });

  describe('validateSingleChoice', () => {
    const question = mockQuestions[0];

    it('should return true for correct single choice answer', () => {
      const result = validateSingleChoice(question, ['opt2']);
      expect(result).toBe(true);
    });

    it('should return false for incorrect single choice answer', () => {
      const result = validateSingleChoice(question, ['opt1']);
      expect(result).toBe(false);
    });

    it('should return false for multiple selections in single choice', () => {
      const result = validateSingleChoice(question, ['opt1', 'opt2']);
      expect(result).toBe(false);
    });

    it('should return false for empty selection', () => {
      const result = validateSingleChoice(question, []);
      expect(result).toBe(false);
    });
  });

  describe('validateMultipleChoice', () => {
    const question = mockQuestions[1];

    it('should return true when all correct options are selected', () => {
      const result = validateMultipleChoice(question, ['opt1', 'opt2', 'opt4']);
      expect(result).toBe(true);
    });

    it('should return false when missing a correct option', () => {
      const result = validateMultipleChoice(question, ['opt1', 'opt2']);
      expect(result).toBe(false);
    });

    it('should return false when an incorrect option is selected', () => {
      const result = validateMultipleChoice(question, ['opt1', 'opt2', 'opt3', 'opt4']);
      expect(result).toBe(false);
    });

    it('should return false for empty selection', () => {
      const result = validateMultipleChoice(question, []);
      expect(result).toBe(false);
    });
  });

  describe('validateTextInput', () => {
    const question = mockQuestions[2];

    it('should return true for correct text answer (case-insensitive)', () => {
      expect(validateTextInput(question, 'Paris')).toBe(true);
      expect(validateTextInput(question, 'paris')).toBe(true);
      expect(validateTextInput(question, 'PARIS')).toBe(true);
    });

    it('should return true for correct answer with whitespace', () => {
      expect(validateTextInput(question, '  Paris  ')).toBe(true);
    });

    it('should return false for incorrect text answer', () => {
      expect(validateTextInput(question, 'London')).toBe(false);
    });

    it('should return false for empty answer', () => {
      expect(validateTextInput(question, '')).toBe(false);
      expect(validateTextInput(question, undefined)).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should validate single choice questions', () => {
      const result = validateAnswer(mockQuestions[0], ['opt2']);
      expect(result).toBe(true);
    });

    it('should validate multiple choice questions', () => {
      const result = validateAnswer(mockQuestions[1], ['opt1', 'opt2', 'opt4']);
      expect(result).toBe(true);
    });

    it('should validate text input questions', () => {
      const result = validateAnswer(mockQuestions[2], [], 'Paris');
      expect(result).toBe(true);
    });
  });

  describe('submitAnswer', () => {
    it('should add answer to session and advance question index', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      const updatedSession = submitAnswer(
        session,
        mockQuestions[0],
        ['opt2'],
        undefined,
        30
      );

      expect(updatedSession.answers).toHaveLength(1);
      expect(updatedSession.answers[0].questionId).toBe('q1');
      expect(updatedSession.answers[0].isCorrect).toBe(true);
      expect(updatedSession.answers[0].timeTaken).toBe(30);
      expect(updatedSession.currentQuestionIndex).toBe(1);
    });

    it('should mark incorrect answer as incorrect', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      const updatedSession = submitAnswer(
        session,
        mockQuestions[0],
        ['opt1'],
        undefined,
        30
      );

      expect(updatedSession.answers[0].isCorrect).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('should calculate total score from correct answers', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 3,
        answers: [
          { questionId: 'q1', selectedOptions: ['opt2'], isCorrect: true, answeredAt: new Date(), timeTaken: 30 },
          { questionId: 'q2', selectedOptions: ['opt1', 'opt2', 'opt4'], isCorrect: true, answeredAt: new Date(), timeTaken: 45 },
          { questionId: 'q3', selectedOptions: [], textAnswer: 'Paris', isCorrect: true, answeredAt: new Date(), timeTaken: 20 },
        ],
        timeRemaining: 200,
        status: 'in_progress',
      };

      const score = calculateScore(session, mockQuestions);
      expect(score).toBe(45); // 10 + 20 + 15
    });

    it('should return 0 for all incorrect answers', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 1,
        answers: [
          { questionId: 'q1', selectedOptions: ['opt1'], isCorrect: false, answeredAt: new Date(), timeTaken: 30 },
        ],
        timeRemaining: 200,
        status: 'in_progress',
      };

      const score = calculateScore(session, mockQuestions);
      expect(score).toBe(0);
    });
  });

  describe('calculateMaxScore', () => {
    it('should calculate maximum possible score', () => {
      const maxScore = calculateMaxScore(mockQuestions);
      expect(maxScore).toBe(45); // 10 + 20 + 15
    });
  });

  describe('calculateCorrectCount', () => {
    it('should count correct answers', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 3,
        answers: [
          { questionId: 'q1', selectedOptions: ['opt2'], isCorrect: true, answeredAt: new Date(), timeTaken: 30 },
          { questionId: 'q2', selectedOptions: ['opt1'], isCorrect: false, answeredAt: new Date(), timeTaken: 45 },
          { questionId: 'q3', selectedOptions: [], textAnswer: 'Paris', isCorrect: true, answeredAt: new Date(), timeTaken: 20 },
        ],
        timeRemaining: 200,
        status: 'in_progress',
      };

      const count = calculateCorrectCount(session);
      expect(count).toBe(2);
    });
  });

  describe('calculateTimeTaken', () => {
    it('should sum up time taken for all answers', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 3,
        answers: [
          { questionId: 'q1', selectedOptions: ['opt2'], isCorrect: true, answeredAt: new Date(), timeTaken: 30 },
          { questionId: 'q2', selectedOptions: ['opt1'], isCorrect: false, answeredAt: new Date(), timeTaken: 45 },
          { questionId: 'q3', selectedOptions: [], textAnswer: 'Paris', isCorrect: true, answeredAt: new Date(), timeTaken: 20 },
        ],
        timeRemaining: 200,
        status: 'in_progress',
      };

      const timeTaken = calculateTimeTaken(session);
      expect(timeTaken).toBe(95); // 30 + 45 + 20
    });
  });

  describe('completeSession', () => {
    it('should generate a complete QuizResult', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 3,
        answers: [
          { questionId: 'q1', selectedOptions: ['opt2'], isCorrect: true, answeredAt: new Date(), timeTaken: 30 },
          { questionId: 'q2', selectedOptions: ['opt1', 'opt2', 'opt4'], isCorrect: true, answeredAt: new Date(), timeTaken: 45 },
          { questionId: 'q3', selectedOptions: [], textAnswer: 'Paris', isCorrect: true, answeredAt: new Date(), timeTaken: 20 },
        ],
        timeRemaining: 200,
        status: 'completed',
      };

      const result = completeSession(session, mockQuestions, 'Test Quiz', 'user-1', 'TestUser');

      expect(result.id).toMatch(/^result-/);
      expect(result.quizId).toBe('quiz-1');
      expect(result.quizName).toBe('Test Quiz');
      expect(result.userId).toBe('user-1');
      expect(result.username).toBe('TestUser');
      expect(result.score).toBe(45);
      expect(result.maxScore).toBe(45);
      expect(result.percentage).toBe(100);
      expect(result.correctCount).toBe(3);
      expect(result.totalQuestions).toBe(3);
      expect(result.timeTaken).toBe(95);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.answers).toHaveLength(3);
    });
  });

  describe('timeoutSession', () => {
    it('should mark session as timed_out', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      const timedOut = timeoutSession(session);

      expect(timedOut.status).toBe('timed_out');
    });
  });

  describe('markSessionCompleted', () => {
    it('should mark session as completed', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      const completed = markSessionCompleted(session);

      expect(completed.status).toBe('completed');
    });
  });

  describe('updateTimeRemaining', () => {
    it('should update time remaining', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      const updated = updateTimeRemaining(session, 150);

      expect(updated.timeRemaining).toBe(150);
    });
  });

  describe('hasMoreQuestions', () => {
    it('should return true when there are more questions', () => {
      const session = createSession('quiz-1', mockQuestions, 300);
      expect(hasMoreQuestions(session, 3)).toBe(true);
    });

    it('should return false when all questions are answered', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 3,
        answers: [],
        timeRemaining: 200,
        status: 'in_progress',
      };

      expect(hasMoreQuestions(session, 3)).toBe(false);
    });
  });

  describe('getCurrentQuestionIndex', () => {
    it('should return current question index', () => {
      const session: QuizSession = {
        id: 'session-1',
        quizId: 'quiz-1',
        startedAt: new Date(),
        currentQuestionIndex: 2,
        answers: [],
        timeRemaining: 200,
        status: 'in_progress',
      };

      expect(getCurrentQuestionIndex(session)).toBe(2);
    });
  });
});
