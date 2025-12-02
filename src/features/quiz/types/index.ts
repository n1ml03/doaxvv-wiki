// Quiz types barrel export
import type { LocalizedString } from '@/shared/types/localization';

/**
 * Question types supported by the quiz system
 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'text_input';

/**
 * Quiz difficulty levels
 */
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Quiz publication status
 */
export type QuizStatus = 'draft' | 'published' | 'archived';

/**
 * Quiz metadata from CSV
 */
export interface Quiz {
  id: number;
  unique_key: string;
  name: LocalizedString;
  description: LocalizedString;
  image: string;
  category: string;
  difficulty: QuizDifficulty;
  time_limit: number; // seconds, 0 for no limit
  question_count: number;
  questions_ref: string; // path to markdown file
  status: QuizStatus;
  updated_at: string;
  author: string;
  tags: string[];
}

/**
 * Option for choice-based questions
 */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Individual quiz question
 */
export interface Question {
  id: string;
  type: QuestionType;
  content: string; // markdown content
  options: QuestionOption[]; // for choice questions
  correctAnswer?: string; // for text input
  explanation?: string;
  timeLimit?: number; // per-question time limit in seconds
  points: number;
}


/**
 * User's answer to a question
 */
export interface UserAnswer {
  questionId: string;
  selectedOptions: string[]; // option IDs for choice questions
  textAnswer?: string; // for text input
  isCorrect: boolean;
  answeredAt: Date;
  timeTaken: number; // seconds
}

/**
 * Active quiz session state
 */
export interface QuizSession {
  id: string;
  quizId: string;
  startedAt: Date;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  timeRemaining: number;
  status: 'in_progress' | 'completed' | 'timed_out';
}

/**
 * Completed quiz result for storage
 */
export interface QuizResult {
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
  timeTaken: number; // seconds
  completedAt: Date;
  answers: UserAnswer[];
}

/**
 * Filters for quiz browsing
 */
export interface QuizFilters {
  category?: string;
  difficulty?: QuizDifficulty;
  status?: QuizStatus;
}
