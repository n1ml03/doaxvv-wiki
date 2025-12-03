import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, ScrollToTop, UnifiedFilterUI } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/shared/components/ui/pagination";

import { contentLoader } from "@/content";
import type { Swimsuit, Character } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { usePagination } from "@/shared/hooks/usePagination";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 24;

const SwimsuitsPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('swimsuits.title'));
  
  const [swimsuits, setSwimsuits] = useState<Swimsuit[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setSwimsuits(contentLoader.getSwimsuits());
      setCharacters(contentLoader.getCharacters());
      setLoading(false);
    }
    loadContent();
  }, []);

  // Character tags for filtering swimsuits by character
  const characterTags = useMemo(() => 
    characters.map(c => ({ 
      value: c.unique_key, 
      label: getLocalizedValue(c.name, currentLanguage) 
    })),
    [characters, currentLanguage]
  );

  // Custom search function that uses localized name and character
  const customSearchFn = useMemo(() => {
    return (item: Swimsuit, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const localizedName = getLocalizedValue(item.name, currentLanguage);
      const searchLower = searchTerm.toLowerCase();
      return localizedName.toLowerCase().includes(searchLower) ||
        item.character.toLowerCase().includes(searchLower);
    };
  }, [currentLanguage]);

  // Custom sort functions for swimsuit-specific sorting
  const customSortFunctions = useMemo(() => ({
    'newest': () => 0, // Default order (by id)
    'a-z': (a: Swimsuit, b: Swimsuit) => 
      getLocalizedValue(a.name, currentLanguage).localeCompare(getLocalizedValue(b.name, currentLanguage)),
    'z-a': (a: Swimsuit, b: Swimsuit) => 
      getLocalizedValue(b.name, currentLanguage).localeCompare(getLocalizedValue(a.name, currentLanguage)),
    'rarity-high': (a: Swimsuit, b: Swimsuit) => {
      const rarityOrder = { SSR: 3, SR: 2, R: 1 };
      return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
             (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
    },
    'pow-high': (a: Swimsuit, b: Swimsuit) => b.stats.POW - a.stats.POW,
    'tec-high': (a: Swimsuit, b: Swimsuit) => b.stats.TEC - a.stats.TEC,
    'stm-high': (a: Swimsuit, b: Swimsuit) => b.stats.STM - a.stats.STM,
  }), [currentLanguage]);

  // Tag field extractor for character filtering
  const tagFieldFn = useMemo(() => {
    return (item: Swimsuit): string[] => [item.character_id];
  }, []);

  // Use unified filter hook
  const {
    state,
    handlers,
    filteredData: filteredSwimsuits,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Swimsuit>({
    preset: 'swimsuits',
    data: swimsuits,
    customSearchFn,
    customSortFunctions,
    tagField: tagFieldFn,
    rarityField: 'rarity',
    defaultSort: 'newest',
  });

  // Pagination
  const pagination = usePagination({
    totalItems: filteredSwimsuits.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.search, state.rarity, state.tags, state.sort]);

  // Get paginated swimsuits
  const paginatedSwimsuits = useMemo(() => 
    filteredSwimsuits.slice(pagination.startIndex, pagination.endIndex),
    [filteredSwimsuits, pagination.startIndex, pagination.endIndex]
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "SSR": return "bg-ssr text-ssr-foreground";
      case "SR": return "bg-sr text-sr-foreground";
      case "R": return "bg-r text-r-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('swimsuits.loading')}</p>
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
          <Breadcrumb items={[{ label: t('nav.swimsuits') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('swimsuits.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('swimsuits.subtitle').replace('{count}', swimsuits.length.toString())}
            </p>
          </div>

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('swimsuits.searchPlaceholder')}
            showResultCount={filteredSwimsuits.length}
            tags={characterTags}
          />

          {/* Results count and pagination info */}
          {filteredSwimsuits.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>
                {t('pagination.showing')
                  .replace('{start}', (pagination.startIndex + 1).toString())
                  .replace('{end}', Math.min(pagination.endIndex, filteredSwimsuits.length).toString())
                  .replace('{total}', filteredSwimsuits.length.toString())}
              </span>
              {pagination.totalPages > 1 && (
                <span>
                  {t('pagination.page')
                    .replace('{current}', pagination.currentPage.toString())
                    .replace('{total}', pagination.totalPages.toString())}
                </span>
              )}
            </div>
          )}

          {/* Card grid: 1 col mobile, 2 col tablet, 3 col large tablet, 4 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {paginatedSwimsuits.map((suit, index) => (
            <Card
                key={suit.id}
                className="group relative overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
              >
              <div className="relative aspect-square overflow-hidden">
                <Link to={`/swimsuits/${suit.unique_key}`} className="absolute inset-0 z-10">
                  <span className="sr-only">{t('swimsuits.viewDetails')}</span>
                </Link>
                <DatasetImage
                  src={suit.image}
                  alt={suit.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className={getRarityColor(suit.rarity)}>
                    {suit.rarity}
                  </Badge>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex gap-2 text-white text-sm">
                    <div className="flex-1 bg-background/20 backdrop-blur rounded px-2 py-1">
                      <div className="text-xs opacity-80">{t('characters.stats.pow')}</div>
                      <div className="font-bold">{suit.stats.POW}</div>
                    </div>
                    <div className="flex-1 bg-background/20 backdrop-blur rounded px-2 py-1">
                      <div className="text-xs opacity-80">{t('characters.stats.tec')}</div>
                      <div className="font-bold">{suit.stats.TEC}</div>
                    </div>
                    <div className="flex-1 bg-background/20 backdrop-blur rounded px-2 py-1">
                      <div className="text-xs opacity-80">{t('characters.stats.stm')}</div>
                      <div className="font-bold">{suit.stats.STM}</div>
                    </div>
                    {suit.stats.APL && (
                      <div className="flex-1 bg-background/20 backdrop-blur rounded px-2 py-1">
                        <div className="text-xs opacity-80">{t('characters.stats.apl')}</div>
                        <div className="font-bold">{suit.stats.APL}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    <Link to={`/swimsuits/${suit.unique_key}`}>
                      <LocalizedText localized={suit.name} />
                    </Link>
                  </h3>
                  <Link 
                    to={`/girls/${suit.character_id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {characters.find(c => c.unique_key === suit.character_id) 
                      ? getLocalizedValue(characters.find(c => c.unique_key === suit.character_id)!.name, currentLanguage) 
                      : suit.character}
                  </Link>
                </div>

                {suit.skills && suit.skills.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-primary">
                      <LocalizedText localized={suit.skills[0].name} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <LocalizedText localized={suit.skills[0].description} />
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {t('swimsuits.updated').replace('{date}', suit.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={pagination.previousPage}
                    className={cn(
                      "cursor-pointer",
                      !pagination.hasPrevious && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {/* First page */}
                {pagination.pageRange[0] > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => pagination.goToPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {pagination.pageRange[0] > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {/* Page range */}
                {pagination.pageRange.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      isActive={pagination.currentPage === page}
                      onClick={() => pagination.goToPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {/* Last page */}
                {pagination.pageRange[pagination.pageRange.length - 1] < pagination.totalPages && (
                  <>
                    {pagination.pageRange[pagination.pageRange.length - 1] < pagination.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => pagination.goToPage(pagination.totalPages)}
                        className="cursor-pointer"
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext 
                    onClick={pagination.nextPage}
                    className={cn(
                      "cursor-pointer",
                      !pagination.hasNext && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {filteredSwimsuits.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">{t('swimsuits.noResults')}</p>
            </div>
          )}

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default SwimsuitsPage;
