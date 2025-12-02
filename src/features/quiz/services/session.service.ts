/**
 * Session Service
 * Manages quiz taking sessions including answer submission, validation, and scoring
 * Requirements: 2.1, 2.6, 4.1
 */

import type { Question, QuestionOption, QuizSession, UserAnswer, QuizResult } from '../types';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique result ID
 */
function generateResultId(): string {
  return `result-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new quiz session
 * Requirements: 2.1 - WHEN a user starts a quiz THEN the Quiz_System SHALL create a Quiz_Session
 * 
 * @param quizId - The unique key of the quiz
 * @param questions - Array of questions for the quiz
 * @param timeLimit - Optional time limit in seconds (0 for no limit)
 */
export function createSession(
  quizId: string,
  questions: Question[],
  timeLimit: number = 0
): QuizSession {
  return {
    id: generateSessionId(),
    quizId,
    startedAt: new Date(),
    currentQuestionIndex: 0,
    answers: [],
    timeRemaining: timeLimit,
    status: 'in_progress',
  };
}

/**
 * Validate a single choice answer
 * Requirements: 2.3 - exactly one correct option selected
 */
export function validateSingleChoice(
  question: Question,
  selectedOptions: string[]
): boolean {
  // Must select exactly one option
  if (selectedOptions.length !== 1) {
    return false;
  }

  const selectedId = selectedOptions[0];
  const selectedOption = question.options.find(opt => opt.id === selectedId);
  
  return selectedOption?.isCorrect === true;
}

/**
 * Validate a multiple choice answer
 * Requirements: 2.4 - all correct options selected, no incorrect
 */
export function validateMultipleChoice(
  question: Question,
  selectedOptions: string[]
): boolean {
  const correctOptionIds = question.options
    .filter(opt => opt.isCorrect)
    .map(opt => opt.id);
  
  // Check if selected options match exactly the correct options
  if (selectedOptions.length !== correctOptionIds.length) {
    return false;
  }

  // All selected must be correct
  const allSelectedAreCorrect = selectedOptions.every(id => 
    correctOptionIds.includes(id)
  );

  // All correct must be selected
  const allCorrectAreSelected = correctOptionIds.every(id =>
    selectedOptions.includes(id)
  );

  return allSelectedAreCorrect && allCorrectAreSelected;
}


/**
 * Validate a text input answer
 * Requirements: 2.5 - answer matches expected (case-insensitive)
 */
export function validateTextInput(
  question: Question,
  textAnswer: string | undefined
): boolean {
  if (!textAnswer || !question.correctAnswer) {
    return false;
  }

  // Case-insensitive comparison with trimmed whitespace
  return textAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
}

/**
 * Validate an answer based on question type
 * Requirements: 2.6 - validate the answer and proceed to the next question
 */
export function validateAnswer(
  question: Question,
  selectedOptions: string[],
  textAnswer?: string
): boolean {
  switch (question.type) {
    case 'single_choice':
      return validateSingleChoice(question, selectedOptions);
    case 'multiple_choice':
      return validateMultipleChoice(question, selectedOptions);
    case 'text_input':
      return validateTextInput(question, textAnswer);
    default:
      return false;
  }
}

/**
 * Submit an answer to the current question
 * Requirements: 2.6 - WHEN a user submits an answer THEN the Quiz_System SHALL validate the answer
 * 
 * @param session - Current quiz session
 * @param question - The question being answered
 * @param selectedOptions - Selected option IDs (for choice questions)
 * @param textAnswer - Text answer (for text input questions)
 * @param timeTaken - Time taken to answer in seconds
 */
export function submitAnswer(
  session: QuizSession,
  question: Question,
  selectedOptions: string[],
  textAnswer: string | undefined,
  timeTaken: number
): QuizSession {
  const isCorrect = validateAnswer(question, selectedOptions, textAnswer);

  const userAnswer: UserAnswer = {
    questionId: question.id,
    selectedOptions,
    textAnswer,
    isCorrect,
    answeredAt: new Date(),
    timeTaken,
  };

  return {
    ...session,
    answers: [...session.answers, userAnswer],
    currentQuestionIndex: session.currentQuestionIndex + 1,
  };
}

/**
 * Calculate the score for a completed session
 * Requirements: 4.1 - calculate the score based on correct answers
 * 
 * @param session - The quiz session
 * @param questions - Array of questions with point values
 */
export function calculateScore(session: QuizSession, questions: Question[]): number {
  let totalScore = 0;

  for (const answer of session.answers) {
    if (answer.isCorrect) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        totalScore += question.points;
      }
    }
  }

  return totalScore;
}

/**
 * Calculate the maximum possible score
 */
export function calculateMaxScore(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

/**
 * Calculate the number of correct answers
 */
export function calculateCorrectCount(session: QuizSession): number {
  return session.answers.filter(a => a.isCorrect).length;
}

/**
 * Calculate total time taken for the quiz
 */
export function calculateTimeTaken(session: QuizSession): number {
  return session.answers.reduce((sum, a) => sum + a.timeTaken, 0);
}

/**
 * Complete a quiz session and generate a result
 * Requirements: 4.1 - WHEN a user completes a quiz THEN the Quiz_System SHALL calculate the score
 * 
 * @param session - The quiz session to complete
 * @param questions - Array of questions
 * @param quizName - Name of the quiz for the result
 * @param userId - User identifier
 * @param username - User display name
 */
export function completeSession(
  session: QuizSession,
  questions: Question[],
  quizName: string,
  userId: string,
  username: string
): QuizResult {
  const score = calculateScore(session, questions);
  const maxScore = calculateMaxScore(questions);
  const correctCount = calculateCorrectCount(session);
  const timeTaken = calculateTimeTaken(session);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    id: generateResultId(),
    quizId: session.quizId,
    quizName,
    userId,
    username,
    score,
    maxScore,
    percentage,
    correctCount,
    totalQuestions: questions.length,
    timeTaken,
    completedAt: new Date(),
    answers: session.answers,
  };
}

/**
 * Mark a session as timed out
 */
export function timeoutSession(session: QuizSession): QuizSession {
  return {
    ...session,
    status: 'timed_out',
  };
}

/**
 * Mark a session as completed
 */
export function markSessionCompleted(session: QuizSession): QuizSession {
  return {
    ...session,
    status: 'completed',
  };
}

/**
 * Update the time remaining in a session
 */
export function updateTimeRemaining(session: QuizSession, timeRemaining: number): QuizSession {
  return {
    ...session,
    timeRemaining,
  };
}

/**
 * Check if the session has more questions
 */
export function hasMoreQuestions(session: QuizSession, totalQuestions: number): boolean {
  return session.currentQuestionIndex < totalQuestions;
}

/**
 * Get the current question index (0-based)
 */
export function getCurrentQuestionIndex(session: QuizSession): number {
  return session.currentQuestionIndex;
}
