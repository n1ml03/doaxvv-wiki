/**
 * QuizTakingPage Component
 * Renders questions with markdown support, timer, progress indicator, and answer options
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/shared/layouts';
import { ResponsiveContainer, MarkdownRenderer } from '@/shared/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  SkipForward,
  Flag,
  Bookmark,
  Zap,
  Keyboard,
} from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import { useQuizSession } from '../hooks/useQuizSession';
import { useQuizResults } from '../hooks/useQuizResults';
import type { QuizResult } from '../types';
import { useLanguage } from '@/shared/contexts/language-hooks';
import { getLocalizedValue } from '@/shared/utils/localization';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

/**
 * Timer display component with warning state
 * Uses quiz-timer-warning animation class when time is low
 */
function TimerDisplay({
  formattedTime,
  isWarning,
  isTimeUp,
  label,
}: {
  formattedTime: string;
  isWarning: boolean;
  isTimeUp?: boolean;
  label: string;
}) {
  const getTimerClasses = () => {
    if (isTimeUp) {
      return 'quiz-time-up';
    }
    if (isWarning) {
      return 'quiz-timer-warning';
    }
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${getTimerClasses()}`}
    >
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">{label}:</span>
      <span className={`font-mono font-bold ${isWarning || isTimeUp ? 'text-inherit' : ''}`}>
        {formattedTime}
      </span>
    </div>
  );
}

/**
 * Question option component for single/multiple choice
 * Uses quiz-answer-correct, quiz-answer-incorrect, and quiz-answer-reveal animation classes
 */
function QuestionOption({
  option,
  isSelected,
  isMultiple,
  onSelect,
  disabled,
  showResult,
  isAnswerCorrect,
  shortcutKey,
}: {
  option: { id: string; text: string; isCorrect: boolean };
  isSelected: boolean;
  isMultiple: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
  showResult: boolean;
  isAnswerCorrect?: boolean;
  shortcutKey?: number;
}) {
  const getOptionStyle = () => {
    if (!showResult) {
      return isSelected
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    // User selected this option and it's correct - green pulse
    if (isSelected && option.isCorrect) {
      return 'quiz-answer-correct';
    }

    // User selected this option but it's incorrect - red shake
    if (isSelected && !option.isCorrect) {
      return 'quiz-answer-incorrect';
    }

    // This is the correct answer but user didn't select it - reveal animation
    if (option.isCorrect && !isAnswerCorrect) {
      return 'quiz-answer-reveal';
    }

    return 'border-border opacity-50';
  };

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${getOptionStyle()} ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
      onClick={() => !disabled && onSelect(option.id)}
    >
      {isMultiple ? (
        <Checkbox
          checked={isSelected}
          disabled={disabled}
          className="mt-0.5"
        />
      ) : (
        <div
          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
          }`}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      )}
      <span className="flex-1 text-foreground">{option.text}</span>
      {shortcutKey && !showResult && (
        <kbd className="hidden sm:inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-muted text-xs text-muted-foreground">
          {shortcutKey}
        </kbd>
      )}
      {showResult && option.isCorrect && (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      )}
      {showResult && isSelected && !option.isCorrect && (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
    </div>
  );
}

/**
 * Time bonus indicator component
 * Shows visual feedback for fast answers
 */
function TimeBonusIndicator({ timeTaken, timeLimit }: { timeTaken: number; timeLimit?: number }) {
  if (!timeLimit || timeTaken >= timeLimit * 0.5) return null;
  
  const bonusLevel = timeTaken < timeLimit * 0.25 ? 'excellent' : 'good';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium animate-bounce ${
      bonusLevel === 'excellent' 
        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
        : 'bg-green-500/20 text-green-600 dark:text-green-400'
    }`}>
      <Zap className="h-3 w-3" />
      {bonusLevel === 'excellent' ? 'Lightning Fast!' : 'Quick Answer!'}
    </div>
  );
}

const QuizTakingPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  const { quiz, questions, isLoading, error } = useQuiz(unique_key);
  const { saveQuizResult } = useQuizResults();

  // Local state for answer selection
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showConfirmFinishWithBookmarks, setShowConfirmFinishWithBookmarks] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Bookmarked questions for review
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  
  // Track correct answers count
  const [correctCount, setCorrectCount] = useState(0);
  
  // Track time bonus for visual feedback
  const [showTimeBonus, setShowTimeBonus] = useState(false);
  const [lastAnswerTime, setLastAnswerTime] = useState(0);

  const questionStartTimeRef = useRef(Date.now());

  // Quiz session hook
  const {
    currentQuestion,
    isInProgress,
    isCompleted,
    result,
    startSession,
    submitAnswer,
    skipQuestion,
    finishQuiz,
    progress,
    quizTimer,
    questionTimer,
    hasQuizTimeLimit,
    hasQuestionTimeLimit,
  } = useQuizSession(quiz, questions, {
    userId: 'anonymous', // TODO: Get from auth context
    username: 'Player',
    onComplete: (quizResult: QuizResult) => {
      saveQuizResult(quizResult);
    },
    onTimeout: () => {
      // Quiz timed out
      setIsTimeUp(true);
    },
    onQuestionTimeout: () => {
      // Question timed out - auto skip
      setIsTimeUp(true);
      setTimeout(() => {
        setSelectedOptions([]);
        setTextAnswer('');
        setShowResult(false);
        setIsTimeUp(false);
      }, 500);
    },
  });

  // Set document title
  const quizName = quiz ? getLocalizedValue(quiz.name, currentLanguage) : '';
  useDocumentTitle(
    isInProgress
      ? `${t('quiz.taking') || 'Taking'}: ${quizName}`
      : quizName || t('quiz.title') || 'Quiz'
  );

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOptions([]);
    setTextAnswer('');
    setShowResult(false);
    setIsAnswerCorrect(null);
    setIsTimeUp(false);
    setShowTimeBonus(false);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestion?.id]);

  // Handle option selection for single choice
  const handleSingleSelect = useCallback((optionId: string) => {
    if (showResult) return;
    setSelectedOptions([optionId]);
  }, [showResult]);

  // Handle option selection for multiple choice
  const handleMultipleSelect = useCallback((optionId: string) => {
    if (showResult) return;
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  }, [showResult]);

  // Check if the current answer is correct
  const checkAnswerCorrectness = useCallback(() => {
    if (!currentQuestion) return false;

    switch (currentQuestion.type) {
      case 'single_choice':
      case 'multiple_choice': {
        const correctOptionIds = currentQuestion.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id);
        const selectedSet = new Set(selectedOptions);
        const correctSet = new Set(correctOptionIds);
        
        if (selectedSet.size !== correctSet.size) return false;
        for (const id of selectedSet) {
          if (!correctSet.has(id)) return false;
        }
        return true;
      }
      case 'text_input': {
        const userAnswer = textAnswer.trim().toLowerCase();
        const correctAnswer = (currentQuestion.correctAnswer || '').trim().toLowerCase();
        return userAnswer === correctAnswer;
      }
      default:
        return false;
    }
  }, [currentQuestion, selectedOptions, textAnswer]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!currentQuestion) return;

    // Calculate time taken for this question
    const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setLastAnswerTime(timeTaken);

    // Check if answer is correct
    const correct = checkAnswerCorrectness();
    setIsAnswerCorrect(correct);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      
      // Show time bonus for fast answers (under 50% of time limit)
      const timeLimit = currentQuestion.timeLimit || (quiz?.time_limit ? quiz.time_limit / questions.length : 30);
      if (timeTaken < timeLimit * 0.5) {
        setShowTimeBonus(true);
      }
    }

    // Show result briefly before moving to next question
    setShowResult(true);
    
    // Submit after a short delay to show feedback
    setTimeout(() => {
      submitAnswer(selectedOptions, textAnswer || undefined);
      setSelectedOptions([]);
      setTextAnswer('');
      setShowResult(false);
      setIsAnswerCorrect(null);
      setShowTimeBonus(false);
    }, 1500); // Slightly longer delay to appreciate the animation
  }, [currentQuestion, selectedOptions, textAnswer, submitAnswer, checkAnswerCorrectness, quiz?.time_limit, questions.length]);

  // Handle skip
  const handleSkip = useCallback(() => {
    skipQuestion();
    setSelectedOptions([]);
    setTextAnswer('');
    setShowResult(false);
  }, [skipQuestion]);

  // Handle finish quiz early
  const handleFinish = useCallback(() => {
    finishQuiz();
  }, [finishQuiz]);

  // Toggle bookmark for current question
  const toggleBookmark = useCallback(() => {
    if (!currentQuestion) return;
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  }, [currentQuestion]);

  // Check if current question is bookmarked
  const isCurrentBookmarked = currentQuestion ? bookmarkedQuestions.has(currentQuestion.id) : false;

  // Handle finish with bookmark check
  const handleFinishWithCheck = useCallback(() => {
    if (bookmarkedQuestions.size > 0) {
      setShowConfirmFinishWithBookmarks(true);
    } else {
      setShowConfirmExit(true);
    }
  }, [bookmarkedQuestions.size]);

  // Check if answer is valid for submission (moved up for keyboard shortcuts)
  const canSubmit = useCallback(() => {
    if (!currentQuestion || showResult) return false;

    switch (currentQuestion.type) {
      case 'single_choice':
        return selectedOptions.length === 1;
      case 'multiple_choice':
        return selectedOptions.length > 0;
      case 'text_input':
        return textAnswer.trim().length > 0;
      default:
        return false;
    }
  }, [currentQuestion, selectedOptions, textAnswer, showResult]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isInProgress || showResult || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Only allow Enter for text input submission
        if (e.key === 'Enter' && currentQuestion.type === 'text_input' && canSubmit()) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      // Number keys 1-9 for option selection
      if (e.key >= '1' && e.key <= '9') {
        const optionIndex = parseInt(e.key) - 1;
        if (currentQuestion.options && optionIndex < currentQuestion.options.length) {
          const option = currentQuestion.options[optionIndex];
          if (currentQuestion.type === 'multiple_choice') {
            handleMultipleSelect(option.id);
          } else {
            handleSingleSelect(option.id);
          }
        }
      }

      // Enter to submit
      if (e.key === 'Enter' && canSubmit()) {
        e.preventDefault();
        handleSubmit();
      }

      // S to skip (with Ctrl/Cmd)
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSkip();
      }

      // B to bookmark
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleBookmark();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInProgress, showResult, currentQuestion, canSubmit, handleSubmit, handleSkip, handleSingleSelect, handleMultipleSelect, toggleBookmark]);

  // Navigate to results when completed
  useEffect(() => {
    if (isCompleted && result) {
      navigate(`/quizzes/${unique_key}/result`, { state: { result } });
    }
  }, [isCompleted, result, navigate, unique_key]);

  // Timer warning threshold (5 seconds)
  const isQuizTimerWarning = hasQuizTimeLimit && quizTimer.timeRemaining <= 5 && quizTimer.timeRemaining > 0;
  const isQuestionTimerWarning = hasQuestionTimeLimit && questionTimer.timeRemaining <= 5 && questionTimer.timeRemaining > 0;
  const isQuizTimeUp = hasQuizTimeLimit && quizTimer.timeRemaining === 0;
  const isQuestionTimeUp = hasQuestionTimeLimit && questionTimer.timeRemaining === 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                {t('quiz.loading') || 'Loading quiz...'}
              </p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertDescription>
                  {error?.message || t('quiz.notFound') || 'Quiz not found'}
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/quizzes')} className="mt-4">
                {t('quiz.backToQuizzes') || 'Back to Quizzes'}
              </Button>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  // Pre-start state
  if (!hasStarted || !isInProgress) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="max-w-2xl mx-auto">
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{quizName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-4">
                      {t('quiz.readyMessage') ||
                        'You are about to start the quiz. Make sure you are ready!'}
                    </p>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <span className="font-medium text-foreground">
                          {questions.length}
                        </span>{' '}
                        {t('quiz.questions') || 'questions'}
                      </div>
                      {quiz.time_limit > 0 && (
                        <div>
                          <span className="font-medium text-foreground">
                            {Math.floor(quiz.time_limit / 60)}
                          </span>{' '}
                          {t('quiz.minutes') || 'minutes'}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      startSession();
                      setHasStarted(true);
                    }}
                    className="w-full"
                    size="lg"
                  >
                    {t('quiz.beginQuiz') || 'Begin Quiz'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/quizzes/${unique_key}`)}
                    className="w-full"
                  >
                    {t('quiz.goBack') || 'Go Back'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <div className="max-w-3xl mx-auto">
            {/* Progress and Timer Header */}
            <div className="mb-6 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t('quiz.question') || 'Question'} {progress.current + 1} /{' '}
                    {progress.total}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Correct count indicator */}
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {correctCount}/{progress.current}
                    </span>
                    {/* Bookmarked count */}
                    {bookmarkedQuestions.size > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Bookmark className="h-4 w-4 fill-current" />
                        {bookmarkedQuestions.size}
                      </span>
                    )}
                    <span>{progress.percentage}%</span>
                  </div>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>

              {/* Timers */}
              <div className="flex flex-wrap gap-3 items-center">
                {hasQuizTimeLimit && (
                  <TimerDisplay
                    formattedTime={quizTimer.formattedTime}
                    isWarning={isQuizTimerWarning}
                    isTimeUp={isQuizTimeUp}
                    label={t('quiz.quizTime') || 'Quiz Time'}
                  />
                )}
                {hasQuestionTimeLimit && (
                  <TimerDisplay
                    formattedTime={questionTimer.formattedTime}
                    isWarning={isQuestionTimerWarning}
                    isTimeUp={isQuestionTimeUp}
                    label={t('quiz.questionTime') || 'Question Time'}
                  />
                )}
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <Card className={`border-border/50 bg-card shadow-card mb-6 ${isCurrentBookmarked ? 'ring-2 ring-yellow-500/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {currentQuestion.type === 'single_choice' &&
                          (t('quiz.singleChoice') || 'Single Choice')}
                        {currentQuestion.type === 'multiple_choice' &&
                          (t('quiz.multipleChoice') || 'Multiple Choice')}
                        {currentQuestion.type === 'text_input' &&
                          (t('quiz.textInput') || 'Text Input')}
                      </Badge>
                      {showTimeBonus && (
                        <TimeBonusIndicator 
                          timeTaken={lastAnswerTime} 
                          timeLimit={currentQuestion.timeLimit || 30} 
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleBookmark}
                              className={isCurrentBookmarked ? 'text-yellow-500' : 'text-muted-foreground'}
                            >
                              <Bookmark className={`h-4 w-4 ${isCurrentBookmarked ? 'fill-current' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCurrentBookmarked ? (t('quiz.removeBookmark') || 'Remove bookmark (B)') : (t('quiz.addBookmark') || 'Bookmark for review (B)')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Badge variant="secondary">
                        {currentQuestion.points} {t('quiz.points') || 'pts'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Content */}
                  <div className="prose-custom">
                    <MarkdownRenderer
                      content={currentQuestion.content}
                      enableToc={false}
                    />
                  </div>

                  {/* Answer Options */}
                  {(currentQuestion.type === 'single_choice' ||
                    currentQuestion.type === 'multiple_choice') && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <QuestionOption
                          key={option.id}
                          option={option}
                          isSelected={selectedOptions.includes(option.id)}
                          isMultiple={currentQuestion.type === 'multiple_choice'}
                          onSelect={
                            currentQuestion.type === 'multiple_choice'
                              ? handleMultipleSelect
                              : handleSingleSelect
                          }
                          disabled={showResult}
                          showResult={showResult}
                          isAnswerCorrect={isAnswerCorrect ?? undefined}
                          shortcutKey={index < 9 ? index + 1 : undefined}
                        />
                      ))}
                    </div>
                  )}

                  {/* Text Input */}
                  {currentQuestion.type === 'text_input' && (
                    <div className="space-y-2">
                      <Label htmlFor="answer">
                        {t('quiz.yourAnswer') || 'Your Answer'}
                      </Label>
                      <Input
                        id="answer"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder={t('quiz.typeAnswer') || 'Type your answer...'}
                        disabled={showResult}
                        className="text-lg"
                      />
                      {showResult && currentQuestion.correctAnswer && (
                        <div className="mt-2 p-3 rounded-lg bg-green-500/10 border border-green-500">
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {t('quiz.correctAnswer') || 'Correct answer'}:{' '}
                            <strong>{currentQuestion.correctAnswer}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation (shown after answer) */}
                  {showResult && currentQuestion.explanation && (
                    <Alert className="quiz-explanation-reveal">
                      <AlertDescription>
                        <strong>{t('quiz.explanation') || 'Explanation'}:</strong>{' '}
                        {currentQuestion.explanation}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={showResult}
                      >
                        <SkipForward className="mr-2 h-4 w-4" />
                        {t('quiz.skip') || 'Skip'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ctrl+S</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  onClick={handleFinishWithCheck}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {t('quiz.finish') || 'Finish'}
                  {bookmarkedQuestions.size > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {bookmarkedQuestions.size}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Keyboard hints */}
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span>1-9: Select</span>
                <span>•</span>
                <span>Enter: Submit</span>
                <span>•</span>
                <span>B: Bookmark</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit()}
                      className="min-w-[120px]"
                    >
                      {t('quiz.submit') || 'Submit'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </ResponsiveContainer>
      </main>

      {/* Confirm Exit Dialog */}
      <AlertDialog open={showConfirmExit} onOpenChange={setShowConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('quiz.confirmFinish') || 'Finish Quiz Early?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('quiz.confirmFinishMessage') ||
                'Are you sure you want to finish the quiz? Unanswered questions will be marked as incorrect.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('quiz.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish}>
              {t('quiz.finishQuiz') || 'Finish Quiz'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Finish with Bookmarks Dialog */}
      <AlertDialog open={showConfirmFinishWithBookmarks} onOpenChange={setShowConfirmFinishWithBookmarks}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              {t('quiz.reviewBookmarks') || 'Review Bookmarked Questions?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('quiz.bookmarkedQuestionsMessage') ||
                  `You have ${bookmarkedQuestions.size} bookmarked question(s) that you may want to review before finishing.`}
              </p>
              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('quiz.bookmarkedQuestions') || 'Bookmarked Questions'}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(bookmarkedQuestions).map((qId) => {
                    const qIndex = questions.findIndex(q => q.id === qId);
                    return (
                      <Badge key={qId} variant="outline" className="text-yellow-600 border-yellow-500">
                        Q{qIndex + 1}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>
              {t('quiz.continueQuiz') || 'Continue Quiz'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinish}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('quiz.finishAnyway') || 'Finish Anyway'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizTakingPage;
