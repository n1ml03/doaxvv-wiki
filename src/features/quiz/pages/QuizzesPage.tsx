/**
 * QuizzesPage Component
 * Main quiz hub displaying available quizzes with search, filter, and stats
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/shared/layouts';
import {
  Breadcrumb,
  ResponsiveContainer,
  DatasetImage,
  ScrollToTop,
  UnifiedFilterUI,
} from '@/shared/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  ChevronRight,
  Clock,
  HelpCircle,
  Trophy,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Target,
  Flame,
  Sparkles,
  Star,
  TrendingUp,
  Play,
} from 'lucide-react';
import { useQuizzes } from '../hooks/useQuizzes';
import { useQuizResults } from '../hooks/useQuizResults';
import { getResultsSummary, downloadCSV } from '../services/export.service';
import type { QuizDifficulty, Quiz } from '../types';
import { useLanguage } from '@/shared/contexts/language-hooks';
import { getLocalizedValue } from '@/shared/utils/localization';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useUnifiedFilter } from '@/shared/hooks/useUnifiedFilter';

function formatTimeLimit(seconds: number): string {
  if (seconds === 0) return 'No limit';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

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


const QuizzesPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  useDocumentTitle(t('quiz.title') || 'Quizzes');

  const {
    filteredData: quizzes,
    isLoading,
    error,
    refetch,
  } = useQuizzes();

  const { results } = useQuizResults();

  // Custom search function for quizzes
  const customSearchFn = useMemo(() => {
    return (item: Quiz, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const name = getLocalizedValue(item.name, currentLanguage);
      const description = getLocalizedValue(item.description, currentLanguage);
      const searchLower = searchTerm.toLowerCase();
      return name.toLowerCase().includes(searchLower) ||
             description.toLowerCase().includes(searchLower) ||
             item.unique_key.toLowerCase().includes(searchLower);
    };
  }, [currentLanguage]);

  // Custom sort functions for quiz-specific sorting
  const customSortFunctions = useMemo(() => {
    const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
    return {
      'newest': () => 0, // Default order
      'a-z': (a: Quiz, b: Quiz) =>
        getLocalizedValue(a.name, currentLanguage).localeCompare(
          getLocalizedValue(b.name, currentLanguage)
        ),
      'z-a': (a: Quiz, b: Quiz) =>
        getLocalizedValue(b.name, currentLanguage).localeCompare(
          getLocalizedValue(a.name, currentLanguage)
        ),
      'difficulty-asc': (a: Quiz, b: Quiz) =>
        difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
      'difficulty-desc': (a: Quiz, b: Quiz) =>
        difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty],
    };
  }, [currentLanguage]);

  // Use unified filter hook with quizzes preset
  const {
    state,
    handlers,
    filteredData: displayedQuizzes,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Quiz>({
    preset: 'quizzes',
    data: quizzes,
    customSearchFn,
    customSortFunctions,
    typeField: 'difficulty',
    defaultSort: 'newest',
  });

  const getBestScore = (quizId: string): number | null => {
    const quizResults = results.filter((r) => r.quizId === quizId);
    if (quizResults.length === 0) return null;
    return Math.max(...quizResults.map((r) => r.percentage));
  };

  const resultsSummary = useMemo(() => getResultsSummary(results), [results]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };



  // Calculate quiz completion status for each quiz
  const getQuizStatus = (quizId: string) => {
    const quizResults = results.filter((r) => r.quizId === quizId);
    if (quizResults.length === 0) return 'not-started';
    const bestScore = Math.max(...quizResults.map((r) => r.percentage));
    if (bestScore === 100) return 'perfect';
    return 'completed';
  };

  // Get attempt count for a quiz
  const getAttemptCount = (quizId: string): number => {
    return results.filter((r) => r.quizId === quizId).length;
  };



  // Calculate hero stats
  const heroStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const completedQuizzes = new Set(results.map((r) => r.quizId)).size;
    const perfectQuizzes = quizzes.filter((quiz) => {
      const quizResults = results.filter((r) => r.quizId === quiz.unique_key);
      if (quizResults.length === 0) return false;
      return Math.max(...quizResults.map((r) => r.percentage)) === 100;
    }).length;
    const completionRate = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
    const masteryRate = totalQuizzes > 0 ? (perfectQuizzes / totalQuizzes) * 100 : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      perfectQuizzes,
      notStarted: totalQuizzes - completedQuizzes,
      completionRate,
      masteryRate,
      totalAttempts: results.length,
      averageScore: resultsSummary.averagePercentage,
    };
  }, [quizzes, results, resultsSummary]);

  // Get featured quiz (prioritize: not attempted > low score > random)
  const featuredQuiz = useMemo(() => {
    // Guard against empty quizzes array
    if (quizzes.length === 0) {
      return null;
    }

    // First, try to find a quiz not yet attempted
    const notAttempted = quizzes.filter(
      (quiz) => !results.some((r) => r.quizId === quiz.unique_key)
    );
    if (notAttempted.length > 0) {
      // Return a "random" one based on current date for variety
      const dayIndex = new Date().getDate() % notAttempted.length;
      return { quiz: notAttempted[dayIndex], reason: 'new' as const };
    }

    // Next, find quiz with lowest best score (room for improvement)
    const quizzesWithScores = quizzes.map((quiz) => {
      const quizResults = results.filter((r) => r.quizId === quiz.unique_key);
      const bestScore =
        quizResults.length > 0 ? Math.max(...quizResults.map((r) => r.percentage)) : 0;
      return { quiz, bestScore };
    });

    // Safe reduce with initial value
    const lowestScore = quizzesWithScores.reduce(
      (min, curr) => (curr.bestScore < min.bestScore ? curr : min),
      quizzesWithScores[0]
    );

    if (lowestScore && lowestScore.bestScore < 100) {
      return { quiz: lowestScore.quiz, reason: 'improve' as const };
    }

    // All perfect! Return random for practice
    const dayIndex = new Date().getDate() % quizzes.length;
    return { quiz: quizzes[dayIndex], reason: 'practice' as const };
  }, [quizzes, results]);



  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.quizzes') || 'Quizzes' }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
              {t('quiz.title') || 'Quizzes'}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('quiz.subtitle') || 'Test your knowledge with interactive quizzes'}
            </p>
          </div>

          {/* Hero Stats Banner */}
          {!isLoading && !error && quizzes.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-card overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* Completion Progress */}
                    <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('quiz.progress') || 'Progress'}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {heroStats.completedQuizzes}/{heroStats.totalQuizzes}
                      </div>
                      <Progress value={heroStats.completionRate} className="h-2 mb-1" />
                      <span className="text-xs text-muted-foreground">
                        {heroStats.completionRate.toFixed(0)}% {t('quiz.completed') || 'completed'}
                      </span>
                    </div>

                    {/* Average Score */}
                    <div className="flex flex-col justify-center p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.avgScore') || 'Avg Score'}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {heroStats.totalAttempts > 0 ? `${heroStats.averageScore.toFixed(0)}%` : '-'}
                      </div>
                    </div>

                    {/* Perfect Scores */}
                    <div className="flex flex-col justify-center p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.perfectScores') || 'Perfect'}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {heroStats.perfectQuizzes}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {heroStats.masteryRate.toFixed(0)}% {t('quiz.mastery') || 'mastery'}
                      </span>
                    </div>

                    {/* Total Attempts */}
                    <div className="flex flex-col justify-center p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">
                          {t('quiz.attempts') || 'Attempts'}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {heroStats.totalAttempts}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t('quiz.totalTries') || 'total tries'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Featured Quiz Section */}
          {!isLoading && !error && featuredQuiz?.quiz && (
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  {featuredQuiz.reason === 'new'
                    ? (t('quiz.tryThisQuiz') || 'Try This Quiz')
                    : featuredQuiz.reason === 'improve'
                    ? (t('quiz.roomToImprove') || 'Room to Improve')
                    : (t('quiz.practiceMore') || 'Practice More')}
                </h2>
              </div>
              <Link to={`/quizzes/${featuredQuiz.quiz.unique_key}`}>
                <Card className="group cursor-pointer border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-32 sm:h-auto overflow-hidden">
                      <DatasetImage
                        src={featuredQuiz.quiz.image}
                        alt={getLocalizedValue(featuredQuiz.quiz.name, currentLanguage)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={`${getDifficultyColor(featuredQuiz.quiz.difficulty)} shadow-sm`}>
                          {featuredQuiz.quiz.difficulty}
                        </Badge>
                      </div>
                      {featuredQuiz.reason === 'new' && (
                        <div className="absolute top-2 right-2 sm:hidden">
                          <Badge className="bg-yellow-500 text-yellow-950">
                            {t('quiz.new') || 'New'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {getLocalizedValue(featuredQuiz.quiz.name, currentLanguage)}
                            </h3>
                            {featuredQuiz.reason === 'new' && (
                              <Badge className="bg-yellow-500 text-yellow-950 hidden sm:inline-flex">
                                {t('quiz.new') || 'New'}
                              </Badge>
                            )}
                            {featuredQuiz.reason === 'improve' && (
                              <Badge variant="outline" className="border-orange-500 text-orange-500 hidden sm:inline-flex">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {t('quiz.improve') || 'Improve'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {getLocalizedValue(featuredQuiz.quiz.description, currentLanguage)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <HelpCircle className="h-4 w-4" />
                              {featuredQuiz.quiz.question_count} {t('quiz.questions') || 'questions'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeLimit(featuredQuiz.quiz.time_limit)}
                            </span>
                            {getBestScore(featuredQuiz.quiz.unique_key) !== null && (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <Trophy className="h-4 w-4" />
                                {getBestScore(featuredQuiz.quiz.unique_key)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="lg" className="shrink-0 hidden sm:flex">
                          <Play className="mr-2 h-4 w-4" />
                          {t('quiz.start') || 'Start'}
                        </Button>
                      </div>
                      <Button className="w-full mt-4 sm:hidden">
                        <Play className="mr-2 h-4 w-4" />
                        {t('quiz.startQuiz') || 'Start Quiz'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                {t('quiz.loading') || 'Loading quizzes...'}
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-destructive mb-4">
                {t('quiz.error') || 'Error loading quizzes'}
              </p>
              <Button onClick={() => refetch()}>{t('quiz.retry') || 'Retry'}</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search and Sort Filters */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <UnifiedFilterUI
                    state={state}
                    handlers={handlers}
                    config={config}
                    activeFilterCount={activeFilterCount}
                    placeholder={t('quiz.searchPlaceholder') || 'Search quizzes...'}
                    showResultCount={displayedQuizzes.length}
                  />
                </div>

                {/* Results Summary Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 bg-card border-border/50"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-0">
                    <div className="p-4 border-b border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {t('results.yourStats') || 'Your Stats'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('results.statsDescription') || 'Your quiz performance summary'}
                      </p>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="text-xl font-bold text-foreground">
                            {resultsSummary.totalResults}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('results.completed') || 'Completed'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div className="text-xl font-bold text-foreground">
                            {resultsSummary.totalResults > 0
                              ? `${resultsSummary.averagePercentage.toFixed(0)}%`
                              : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('results.avgScore') || 'Avg Score'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-xl font-bold text-foreground">
                            {resultsSummary.totalResults > 0
                              ? formatTime(resultsSummary.averageTimeTaken)
                              : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('results.avgTime') || 'Avg Time'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <HelpCircle className="h-4 w-4 text-purple-500" />
                          </div>
                          <div className="text-xl font-bold text-foreground">
                            {resultsSummary.uniqueQuizzes}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('results.uniqueQuizzes') || 'Unique Quizzes'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => downloadCSV(results)}
                        disabled={results.length === 0}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        {t('results.exportCSV') || 'Export to CSV'}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>


              {/* Quiz Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {displayedQuizzes.map((quiz, index) => {
                  const bestScore = getBestScore(quiz.unique_key);
                  const quizName = getLocalizedValue(quiz.name, currentLanguage);
                  const quizDescription = getLocalizedValue(quiz.description, currentLanguage);
                  const status = getQuizStatus(quiz.unique_key);
                  const attemptCount = getAttemptCount(quiz.unique_key);

                  return (
                    <Link key={quiz.id} to={`/quizzes/${quiz.unique_key}`}>
                      <Card
                        className={`group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full ${
                          status === 'perfect' ? 'ring-2 ring-yellow-500/30' : ''
                        }`}
                      >
                        <div className="relative h-52 overflow-hidden">
                          <DatasetImage
                            src={quiz.image}
                            alt={quizName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                              {t(`difficulty.${quiz.difficulty.toLowerCase()}`) || quiz.difficulty}
                            </Badge>
                            {status === 'not-started' && (
                              <Badge className="bg-blue-500 text-white">
                                {t('quiz.new') || 'New'}
                              </Badge>
                            )}
                          </div>

                          <div className="absolute top-3 right-3 flex gap-2">
                            {status === 'perfect' && (
                              <Badge className="bg-yellow-500 text-yellow-950 gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                {t('quiz.perfect') || 'Perfect'}
                              </Badge>
                            )}
                            {bestScore !== null && status !== 'perfect' && (
                              <Badge
                                variant="outline"
                                className="bg-background/90 text-foreground border-0 gap-1"
                              >
                                <Trophy className="h-3 w-3" />
                                {bestScore}%
                              </Badge>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-lg font-bold text-white drop-shadow-lg">
                              {quizName}
                            </h3>
                          </div>
                        </div>

                        <CardHeader className="pb-2">
                          <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                            {quizDescription}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <HelpCircle className="h-4 w-4" />
                                <span>
                                  {quiz.question_count} {t('quiz.questions') || 'questions'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTimeLimit(quiz.time_limit)}</span>
                              </div>
                            </div>
                            {attemptCount > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Flame className="h-3.5 w-3.5 text-orange-500" />
                                <span>{attemptCount}x</span>
                              </div>
                            )}
                          </div>

                          {quiz.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {quiz.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {quiz.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{quiz.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {status === 'not-started'
                              ? (t('quiz.start') || 'Start Quiz')
                              : status === 'perfect'
                              ? (t('quiz.playAgain') || 'Play Again')
                              : (t('quiz.continue') || 'Try Again')}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {displayedQuizzes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t('quiz.noResults') || 'No quizzes found matching your criteria'}
                  </p>
                </div>
              )}

              <ScrollToTop />
            </div>
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default QuizzesPage;
