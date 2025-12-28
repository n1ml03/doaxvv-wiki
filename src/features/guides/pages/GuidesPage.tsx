import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, ResponsiveContainer, DatasetImage, ScrollToTop, UnifiedFilterUI, PageLoadingState } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { ChevronRight } from "lucide-react";
import { useGuides, useCategories } from "@/content/hooks";
import type { Guide } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";

const GuidesPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { data: guides = [], isLoading: loading, error, refetch } = useGuides();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('guides.title'));
  const { data: categoriesData = [] } = useCategories();

  // Category options for filtering
  const categoryOptions = useMemo(() => categoriesData.map(c => ({
    value: c.unique_key,
    label: getLocalizedValue(c.name, currentLanguage)
  })), [categoriesData, currentLanguage]);

  // Custom search function for guides
  const customSearchFn = useMemo(() => {
    return (item: Guide, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const searchLower = searchTerm.toLowerCase();
      return getLocalizedValue(item.localizedTitle, currentLanguage).toLowerCase().includes(searchLower) ||
             getLocalizedValue(item.localizedSummary, currentLanguage).toLowerCase().includes(searchLower) ||
             item.unique_key.toLowerCase().includes(searchLower);
    };
  }, [currentLanguage]);

  // Custom sort functions for guide-specific sorting
  const customSortFunctions = useMemo(() => {
    return {
      'newest': () => 0, // Default order
      'a-z': (a: Guide, b: Guide) => 
        getLocalizedValue(a.localizedTitle, currentLanguage).localeCompare(getLocalizedValue(b.localizedTitle, currentLanguage)),
      'z-a': (a: Guide, b: Guide) => 
        getLocalizedValue(b.localizedTitle, currentLanguage).localeCompare(getLocalizedValue(a.localizedTitle, currentLanguage)),
    };
  }, [currentLanguage]);

  // Use unified filter hook with guides preset
  const {
    state,
    handlers,
    filteredData: filteredGuides,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Guide>({
    preset: 'guides',
    data: guides,
    customSearchFn,
    customSortFunctions,
    categoryField: 'category',
    defaultSort: 'newest',
  });


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <PageLoadingState variant="list" itemCount={6} />
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="py-16">
              <Alert variant="destructive">
                <AlertDescription>
                  {t('guides.error')}: {error.message}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-4">
                <Button onClick={() => refetch()}>{t('guides.retry')}</Button>
              </div>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.guides') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('guides.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('guides.subtitle')}</p>
          </div>

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('guides.searchPlaceholder')}
            showResultCount={filteredGuides.length}
            categories={categoryOptions}
          />

          {/* Card grid: 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredGuides.map((guide, index) => {
            return (
              <Link key={guide.id} to={`/guides/${guide.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full"
                >
                  <div className="relative h-48 overflow-hidden">
                    <DatasetImage
                      src={guide.image}
                      alt={guide.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                        {guide.read_time}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg flex-1">
                        {getLocalizedValue(guide.localizedTitle, currentLanguage)}
                      </h3>
                    </div>
                  </div>

                  <CardHeader>
                    <CardDescription className="text-sm text-muted-foreground">
                      {getLocalizedValue(guide.localizedSummary, currentLanguage)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">{t('guides.topics')}</div>
                      <div className="flex flex-wrap gap-2">
                        {guide.topics.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t('guides.read')}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">{t('guides.noResults')}</p>
            </div>
          )}

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GuidesPage;
