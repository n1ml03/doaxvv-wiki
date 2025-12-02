/**
 * useQuizSession Hook
 * Manages quiz session state, current question, and answer submission
 * Requirements: 2.1, 2.6, 3.1, 3.2, 3.3, 3.4
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Quiz, Question, QuizSession, QuizResult } from '../types';
import {
  createSession,
  submitAnswer as submitAnswerService,
  completeSession,
  markSessionCompleted,
  timeoutSession,
  hasMoreQuestions,
  updateTimeRemaining,
} from '../services/session.service';
import { useQuizTimer } from './useQuizTimer';

export interface UseQuizSessionOptions {
  /** User ID for result tracking */
  userId?: string;
  /** Username for result display */
  username?: string;
  /** Callback when quiz is completed */
  onComplete?: (result: QuizResult) => void;
  /** Callback when time runs out */
  onTimeout?: () => void;
  /** Callback when question time runs out */
  onQuestionTimeout?: () => void;
  /** Callback when timer ticks (for warning animations) */
  onTimerTick?: (timeRemaining: number) => void;
  /** Callback when question timer ticks */
  onQuestionTimerTick?: (timeRemaining: number) => void;
}

export interface UseQuizSessionResult {
  /** Current session state */
  session: QuizSession | null;
  /** Current question being displayed */
  currentQuestion: Question | null;
  /** Whether the quiz is in progress */
  isInProgress: boolean;
  /** Whether the quiz is completed */
  isCompleted: boolean;
  /** Quiz result (available after completion) */
  result: QuizResult | null;
  /** Start a new quiz session */
  startSession: () => void;
  /** Submit an answer for the current question */
  submitAnswer: (selectedOptions: string[], textAnswer?: string) => void;
  /** Move to the next question without answering (skip) */
  skipQuestion: () => void;
  /** Complete the quiz early */
  finishQuiz: () => QuizResult | null;
  /** Handle quiz timeout */
  handleTimeout: () => void;
  /** Update time remaining */
  setTimeRemaining: (time: number) => void;
  /** Reset the session */
  resetSession: () => void;
  /** Progress information */
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  /** Quiz timer state (Requirements: 3.1, 3.2) */
  quizTimer: {
    timeRemaining: number;
    formattedTime: string;
    isRunning: boolean;
    isExpired: boolean;
  };
  /** Question timer state (Requirements: 3.3, 3.4) */
  questionTimer: {
    timeRemaining: number;
    formattedTime: string;
    isRunning: boolean;
    isExpired: boolean;
  };
  /** Whether the quiz has a time limit */
  hasQuizTimeLimit: boolean;
  /** Whether the current question has a time limit */
  hasQuestionTimeLimit: boolean;
}


/**
 * Hook for managing a quiz session
 * 
 * @param quiz - The quiz metadata
 * @param questions - Array of questions for the quiz
 * @param options - Hook options
 * 
 * @example
 * ```tsx
 * const { quiz, questions } = useQuiz('doax-basics-quiz');
 * const {
 *   session,
 *   currentQuestion,
 *   submitAnswer,
 *   progress,
 *   isCompleted,
 *   result,
 *   quizTimer,
 *   questionTimer,
 * } = useQuizSession(quiz, questions, {
 *   userId: 'user-123',
 *   username: 'Player1',
 *   onComplete: (result) => console.log('Quiz completed!', result),
 * });
 * ```
 */
export function useQuizSession(
  quiz: Quiz | null,
  questions: Question[],
  options: UseQuizSessionOptions = {}
): UseQuizSessionResult {
  const {
    userId = 'anonymous',
    username = 'Anonymous',
    onComplete,
    onTimeout,
    onQuestionTimeout,
    onTimerTick,
    onQuestionTimerTick,
  } = options;

  const [session, setSession] = useState<QuizSession | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  
  // Track time spent on current question
  const questionStartTimeRef = useRef<number>(Date.now());
  
  // Track if we're handling a timeout to prevent double-processing
  const isHandlingTimeoutRef = useRef(false);

  // Determine time limits
  const quizTimeLimit = quiz?.time_limit ?? 0;
  const hasQuizTimeLimit = quizTimeLimit > 0;

  /**
   * Quiz-level timer (Requirements: 3.1, 3.2)
   * WHEN a quiz has a time limit THEN the Quiz_System SHALL display a countdown timer
   * WHEN the quiz timer reaches zero THEN the Quiz_System SHALL automatically end the quiz
   */
  const quizTimerResult = useQuizTimer({
    initialTime: quizTimeLimit,
    autoStart: false,
    onTick: onTimerTick,
    onExpire: undefined, // We'll handle expiration manually to avoid stale closure issues
  });

  // Get current question for question timer
  const currentQuestion = useMemo(() => {
    if (!session || session.status !== 'in_progress') {
      return null;
    }
    return questions[session.currentQuestionIndex] ?? null;
  }, [session, questions]);

  const questionTimeLimit = currentQuestion?.timeLimit ?? 0;
  const hasQuestionTimeLimit = questionTimeLimit > 0;

  /**
   * Question-level timer (Requirements: 3.3, 3.4)
   * WHEN a question has an individual time limit THEN the Quiz_System SHALL display a question-specific countdown
   * WHEN a question timer expires THEN the Quiz_System SHALL mark the question as unanswered
   */
  const questionTimerResult = useQuizTimer({
    initialTime: questionTimeLimit,
    autoStart: false,
    onTick: onQuestionTimerTick,
    onExpire: undefined, // We'll handle expiration manually
  });

  /**
   * Start a new quiz session
   */
  const startSession = useCallback(() => {
    if (!quiz || questions.length === 0) {
      return;
    }

    const newSession = createSession(
      quiz.unique_key,
      questions,
      quiz.time_limit
    );
    setSession(newSession);
    setResult(null);
    
    // Reset question start time
    questionStartTimeRef.current = Date.now();
    isHandlingTimeoutRef.current = false;
    
    // Start quiz timer if there's a time limit
    if (quiz.time_limit > 0) {
      quizTimerResult.reset(quiz.time_limit);
      // Timer will be started after reset completes
      setTimeout(() => quizTimerResult.start(), 0);
    }
    
    // Start question timer if first question has a time limit
    const firstQuestion = questions[0];
    if (firstQuestion?.timeLimit && firstQuestion.timeLimit > 0) {
      questionTimerResult.reset(firstQuestion.timeLimit);
      setTimeout(() => questionTimerResult.start(), 0);
    }
  }, [quiz, questions, quizTimerResult, questionTimerResult]);

  /**
   * Calculate time taken for current question
   */
  const getTimeTaken = useCallback(() => {
    return Math.round((Date.now() - questionStartTimeRef.current) / 1000);
  }, []);

  /**
   * Start timer for next question
   */
  const startNextQuestionTimer = useCallback((nextQuestionIndex: number) => {
    // Reset question start time
    questionStartTimeRef.current = Date.now();
    
    // Start question timer if next question has a time limit
    const nextQuestion = questions[nextQuestionIndex];
    if (nextQuestion?.timeLimit && nextQuestion.timeLimit > 0) {
      questionTimerResult.reset(nextQuestion.timeLimit);
      setTimeout(() => questionTimerResult.start(), 0);
    } else {
      // No time limit for next question, pause the timer
      questionTimerResult.pause();
    }
  }, [questions, questionTimerResult]);

  /**
   * Submit an answer for the current question
   */
  const submitAnswer = useCallback((
    selectedOptions: string[],
    textAnswer?: string
  ) => {
    if (!session || !currentQuestion || session.status !== 'in_progress') {
      return;
    }

    const timeTaken = getTimeTaken();

    const updatedSession = submitAnswerService(
      session,
      currentQuestion,
      selectedOptions,
      textAnswer,
      timeTaken
    );

    // Check if quiz is complete
    if (!hasMoreQuestions(updatedSession, questions.length)) {
      const completedSession = markSessionCompleted(updatedSession);
      setSession(completedSession);

      // Stop timers
      quizTimerResult.pause();
      questionTimerResult.pause();

      // Generate result
      const quizName = quiz?.name.en ?? quiz?.unique_key ?? 'Quiz';
      const quizResult = completeSession(
        completedSession,
        questions,
        quizName,
        userId,
        username
      );
      setResult(quizResult);

      if (onComplete) {
        onComplete(quizResult);
      }
    } else {
      setSession(updatedSession);
      // Start timer for next question
      startNextQuestionTimer(updatedSession.currentQuestionIndex);
    }
  }, [session, currentQuestion, questions, quiz, userId, username, onComplete, getTimeTaken, quizTimerResult, questionTimerResult, startNextQuestionTimer]);

  /**
   * Skip the current question (mark as unanswered)
   * Requirements: 3.4 - mark the question as unanswered and proceed to the next question
   */
  const skipQuestion = useCallback(() => {
    // Submit with empty answer (will be marked incorrect)
    submitAnswer([], undefined);
  }, [submitAnswer]);

  /**
   * Complete the quiz early
   */
  const finishQuiz = useCallback((): QuizResult | null => {
    if (!session || !quiz) {
      return null;
    }

    // Stop timers
    quizTimerResult.pause();
    questionTimerResult.pause();

    const completedSession = markSessionCompleted(session);
    setSession(completedSession);

    const quizName = quiz.name.en ?? quiz.unique_key ?? 'Quiz';
    const quizResult = completeSession(
      completedSession,
      questions,
      quizName,
      userId,
      username
    );
    setResult(quizResult);

    if (onComplete) {
      onComplete(quizResult);
    }

    return quizResult;
  }, [session, quiz, questions, userId, username, onComplete, quizTimerResult, questionTimerResult]);

  /**
   * Handle quiz timeout
   * Requirements: 3.2 - WHEN the quiz timer reaches zero THEN the Quiz_System SHALL automatically end the quiz
   */
  const handleTimeout = useCallback(() => {
    if (!session || !quiz || isHandlingTimeoutRef.current) {
      return;
    }

    isHandlingTimeoutRef.current = true;

    // Stop timers
    quizTimerResult.pause();
    questionTimerResult.pause();

    const timedOutSession = timeoutSession(session);
    setSession(timedOutSession);

    const quizName = quiz.name.en ?? quiz.unique_key ?? 'Quiz';
    const quizResult = completeSession(
      timedOutSession,
      questions,
      quizName,
      userId,
      username
    );
    setResult(quizResult);

    if (onTimeout) {
      onTimeout();
    }

    if (onComplete) {
      onComplete(quizResult);
    }
  }, [session, quiz, questions, userId, username, onTimeout, onComplete, quizTimerResult, questionTimerResult]);

  /**
   * Handle question timeout
   * Requirements: 3.4 - WHEN a question timer expires THEN the Quiz_System SHALL mark the question as unanswered
   */
  const handleQuestionTimeout = useCallback(() => {
    if (!session || session.status !== 'in_progress' || isHandlingTimeoutRef.current) {
      return;
    }

    // Call the question timeout callback
    if (onQuestionTimeout) {
      onQuestionTimeout();
    }

    // Auto-submit with empty answer (skip the question)
    skipQuestion();
  }, [session, onQuestionTimeout, skipQuestion]);

  /**
   * Effect to handle quiz timer expiration
   * Requirements: 3.2 - auto-complete on quiz timeout
   */
  useEffect(() => {
    if (quizTimerResult.isExpired && session?.status === 'in_progress') {
      handleTimeout();
    }
  }, [quizTimerResult.isExpired, session?.status, handleTimeout]);

  /**
   * Effect to handle question timer expiration
   * Requirements: 3.4 - auto-submit on question timeout
   */
  useEffect(() => {
    if (questionTimerResult.isExpired && session?.status === 'in_progress' && hasQuestionTimeLimit) {
      handleQuestionTimeout();
    }
  }, [questionTimerResult.isExpired, session?.status, hasQuestionTimeLimit, handleQuestionTimeout]);

  /**
   * Update time remaining
   */
  const setTimeRemaining = useCallback((time: number) => {
    if (!session) {
      return;
    }
    setSession(updateTimeRemaining(session, time));
  }, [session]);

  /**
   * Reset the session
   */
  const resetSession = useCallback(() => {
    setSession(null);
    setResult(null);
    quizTimerResult.reset();
    questionTimerResult.reset();
    isHandlingTimeoutRef.current = false;
  }, [quizTimerResult, questionTimerResult]);

  /**
   * Calculate progress
   */
  const progress = useMemo(() => {
    const current = session?.currentQuestionIndex ?? 0;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }, [session, questions.length]);

  /**
   * Derived state
   */
  const isInProgress = session?.status === 'in_progress';
  const isCompleted = session?.status === 'completed' || session?.status === 'timed_out';

  /**
   * Timer state for external consumption
   */
  const quizTimer = {
    timeRemaining: quizTimerResult.timeRemaining,
    formattedTime: quizTimerResult.formattedTime,
    isRunning: quizTimerResult.isRunning,
    isExpired: quizTimerResult.isExpired,
  };

  const questionTimer = {
    timeRemaining: questionTimerResult.timeRemaining,
    formattedTime: questionTimerResult.formattedTime,
    isRunning: questionTimerResult.isRunning,
    isExpired: questionTimerResult.isExpired,
  };

  return {
    session,
    currentQuestion,
    isInProgress,
    isCompleted,
    result,
    startSession,
    submitAnswer,
    skipQuestion,
    finishQuiz,
    handleTimeout,
    setTimeRemaining,
    resetSession,
    progress,
    quizTimer,
    questionTimer,
    hasQuizTimeLimit,
    hasQuestionTimeLimit,
  };
}
