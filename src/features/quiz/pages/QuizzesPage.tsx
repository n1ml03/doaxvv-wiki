/**
 * QuizzesPage Component
 * Main quiz hub displaying available quizzes with search, filter, and stats
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/shared/layouts';
import { Breadcrumb, ResponsiveContainer, DatasetImage, ScrollToTop, UnifiedFilterUI } from '@/shared/components';
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
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
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase());
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
              {/* Filters */}
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

                  return (
                    <Link key={quiz.id} to={`/quizzes/${quiz.unique_key}`}>
                      <Card
                        className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in h-full"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="relative h-40 overflow-hidden">
                          <DatasetImage
                            src={quiz.image}
                            alt={quizName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                              {t(`difficulty.${quiz.difficulty.toLowerCase()}`) || quiz.difficulty}
                            </Badge>
                          </div>

                          {bestScore !== null && (
                            <div className="absolute top-3 right-3">
                              <Badge
                                variant="outline"
                                className="bg-background/90 text-foreground border-0 gap-1"
                              >
                                <Trophy className="h-3 w-3" />
                                {bestScore}%
                              </Badge>
                            </div>
                          )}

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
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                            {t('quiz.start') || 'Start Quiz'}
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
