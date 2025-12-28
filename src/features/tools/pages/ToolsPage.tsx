import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, ResponsiveContainer, DatasetImage, ScrollToTop, UnifiedFilterUI, PageLoadingState } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { ChevronRight, Wrench } from "lucide-react";
import { useTools, useCategories } from "@/content/hooks";
import type { Tool } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";

const ToolsPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('tools.title'));
  
  const { data: tools = [], isLoading: loading, error, refetch } = useTools();
  const { data: categoriesData = [] } = useCategories();

  const categoryOptions = useMemo(() => categoriesData.map(c => ({
    value: c.unique_key,
    label: getLocalizedValue(c.name, currentLanguage)
  })), [categoriesData, currentLanguage]);

  // Custom search function for tools
  const customSearchFn = useMemo(() => {
    return (item: Tool, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const title = getLocalizedValue(item.localizedTitle, currentLanguage).toLowerCase();
      const summary = getLocalizedValue(item.localizedSummary, currentLanguage).toLowerCase();
      const search = searchTerm.toLowerCase();
      return title.includes(search) || summary.includes(search) || item.unique_key.toLowerCase().includes(search);
    };
  }, [currentLanguage]);

  // Custom sort functions for tool-specific sorting
  const customSortFunctions = useMemo(() => ({
    'newest': (a: Tool, b: Tool) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    'a-z': (a: Tool, b: Tool) => 
      getLocalizedValue(a.localizedTitle, currentLanguage).localeCompare(getLocalizedValue(b.localizedTitle, currentLanguage)),
    'z-a': (a: Tool, b: Tool) => 
      getLocalizedValue(b.localizedTitle, currentLanguage).localeCompare(getLocalizedValue(a.localizedTitle, currentLanguage)),
  }), [currentLanguage]);

  // Use unified filter hook
  const {
    state,
    handlers,
    filteredData: filteredTools,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Tool>({
    preset: 'default',
    data: tools,
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
                  {t('tools.error')}: {error.message}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-4">
                <Button onClick={() => refetch()}>{t('tools.retry')}</Button>
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
          <Breadcrumb items={[{ label: t('nav.tools') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('tools.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('tools.subtitle')}</p>
          </div>

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('tools.searchPlaceholder')}
            showResultCount={filteredTools.length}
            categories={categoryOptions}
          />

          {/* Card grid: 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredTools.map((tool, index) => (
              <Link key={tool.id} to={`/tools/${tool.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full"
                >
                  <div className="relative h-48 overflow-hidden">
                    <DatasetImage
                      src={tool.image}
                      alt={getLocalizedValue(tool.localizedTitle, currentLanguage)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                        <Wrench className="h-3 w-3 mr-1" />
                        {tool.category}
                      </Badge>
                      {tool.version && (
                        <Badge variant="secondary" className="bg-background/90 text-foreground border-0">
                          v{tool.version}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg flex-1">
                        {getLocalizedValue(tool.localizedTitle, currentLanguage)}
                      </h3>
                    </div>
                  </div>

                  <CardHeader>
                    <CardDescription className="text-sm text-muted-foreground">
                      {getLocalizedValue(tool.localizedSummary, currentLanguage)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {tool.tags && tool.tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {tool.tags.slice(0, 4).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t('tools.viewDetails')}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">{t('tools.noResults')}</p>
            </div>
          )}

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ToolsPage;
