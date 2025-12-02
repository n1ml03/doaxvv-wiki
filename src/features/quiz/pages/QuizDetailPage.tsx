/**
 * QuizDetailPage Component
 * Shows quiz details, description, and start button
 * Displays best score if user has previous results
 * Requirements: 1.4, 4.3
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/shared/layouts';
import { Breadcrumb, ResponsiveContainer, DatasetImage, ScrollToTop } from '@/shared/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Clock,
  HelpCircle,
  Trophy,
  Play,
  History,
  Target,
  Calendar,
  User,
  Download,
} from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import { useQuizResults } from '../hooks/useQuizResults';
import { exportQuizQA } from '../services/export.service';
import type { QuizDifficulty } from '../types';
import { useLanguage } from '@/shared/contexts/language-hooks';
import { getLocalizedValue } from '@/shared/utils/localization';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

/**
 * Format time limit in seconds to a human-readable string
 */
function formatTimeLimit(seconds: number): string {
  if (seconds === 0) return 'No time limit';
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date to a readable string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get difficulty badge color
 */
function getDifficultyColor(difficulty: QuizDifficulty): string {
  switch (difficulty) {
    case 'Easy':
      return 'bg-accent text-accent-foreground';
    case 'Medium':
      return 'bg-primary text-primary-foreground';
    case 'Hard':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const QuizDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  const { quiz, questions, isLoading, error } = useQuiz(unique_key);
  const { results } = useQuizResults({ quizId: unique_key });

  // Set document title
  const quizName = quiz ? getLocalizedValue(quiz.name, currentLanguage) : '';
  useDocumentTitle(quizName || t('quiz.detail') || 'Quiz Details');

  // Get best result for this quiz
  const bestResult = results.length > 0
    ? results.reduce((best, current) =>
        current.percentage > best.percentage ? current : best
      )
    : null;

  // Get recent attempts (last 5)
  const recentAttempts = results.slice(0, 5);

  const handleStartQuiz = () => {
    if (quiz) {
      navigate(`/quizzes/${quiz.unique_key}/take`);
    }
  };

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

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb
              items={[
                { label: t('nav.quizzes') || 'Quizzes', href: '/quizzes' },
                { label: t('quiz.notFound') || 'Not Found' },
              ]}
            />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {t('quiz.notFound') || 'Quiz Not Found'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {error?.message || t('quiz.notFoundMessage') || 'The quiz you are looking for does not exist.'}
              </p>
              <Link to="/quizzes">
                <Button>{t('quiz.backToQuizzes') || 'Back to Quizzes'}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const quizDescription = getLocalizedValue(quiz.description, currentLanguage);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb
            items={[
              { label: t('nav.quizzes') || 'Quizzes', href: '/quizzes' },
              { label: quizName },
            ]}
          />

          <article className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
              <DatasetImage
                src={quiz.image}
                alt={quizName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                  <Badge className={getDifficultyColor(quiz.difficulty)}>
                    {t(`difficulty.${quiz.difficulty.toLowerCase()}`) || quiz.difficulty}
                  </Badge>
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                    {quiz.category}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                  {quizName}
                </h1>
                <p className="text-sm sm:text-lg text-white/90 max-w-3xl line-clamp-2 sm:line-clamp-none">
                  {quizDescription}
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Quiz Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quiz Stats Card */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {t('quiz.aboutThisQuiz') || 'About This Quiz'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {quizDescription}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                        <HelpCircle className="h-6 w-6 text-primary mb-2" />
                        <span className="text-2xl font-bold text-foreground">
                          {quiz.question_count}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.questions') || 'Questions'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                        <Clock className="h-6 w-6 text-primary mb-2" />
                        <span className="text-2xl font-bold text-foreground">
                          {quiz.time_limit > 0 ? Math.floor(quiz.time_limit / 60) : '∞'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {quiz.time_limit > 0 ? t('quiz.minutes') || 'Minutes' : t('quiz.noLimit') || 'No Limit'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                        <Target className="h-6 w-6 text-primary mb-2" />
                        <span className="text-2xl font-bold text-foreground">
                          {quiz.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.difficulty') || 'Difficulty'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                        <History className="h-6 w-6 text-primary mb-2" />
                        <span className="text-2xl font-bold text-foreground">
                          {results.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.attempts') || 'Attempts'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {quiz.tags.length > 0 && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">{t('quiz.tags') || 'Tags'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {quiz.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Attempts */}
                {recentAttempts.length > 0 && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        {t('quiz.recentAttempts') || 'Recent Attempts'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentAttempts.map((result, index) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                #{index + 1}
                              </span>
                              <div>
                                <div className="font-medium text-foreground">
                                  {result.percentage}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {result.correctCount}/{result.totalQuestions} correct
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(new Date(result.completedAt))}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportQuizQA({ result, questions, format: 'csv' })}
                                title={t('quiz.exportQA') || 'Export Q&A'}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Start Quiz */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-6">
                  {/* Best Score Card */}
                  {bestResult && (
                    <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          {t('quiz.bestScore') || 'Best Score'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">
                            {bestResult.percentage}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bestResult.correctCount}/{bestResult.totalQuestions}{' '}
                            {t('quiz.correct') || 'correct'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(new Date(bestResult.completedAt))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Start Quiz Card */}
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('quiz.readyToStart') || 'Ready to Start?'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          <span>
                            {quiz.question_count} {t('quiz.questions') || 'questions'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeLimit(quiz.time_limit)}</span>
                        </div>
                        {quiz.author && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{quiz.author}</span>
                          </div>
                        )}
                        {quiz.updated_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{quiz.updated_at}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleStartQuiz}
                        className="w-full"
                        size="lg"
                        disabled={questions.length === 0}
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {t('quiz.startQuiz') || 'Start Quiz'}
                      </Button>

                      {questions.length === 0 && (
                        <Alert>
                          <AlertDescription>
                            {t('quiz.noQuestions') || 'This quiz has no questions yet.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </article>

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default QuizDetailPage;
