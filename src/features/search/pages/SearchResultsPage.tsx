/**
 * SearchResultsPage
 * Optimized search results interface with:
 * - FlexSearch indexed search (O(1) performance)
 * - Virtual scrolling for large result sets
 * - Pagination for manageable data
 * - Debounced search input
 * - Filter chips by content type
 */

import { useState, useMemo, useEffect, useDeferredValue, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import Header from "@/shared/layouts/Header";
import { Breadcrumb } from "@/shared/components";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/shared/components/ui/pagination";
import { Search, X, SlidersHorizontal, Users, Sparkles, Calendar, Gift, BookOpen, Package, Film, ArrowRight, Loader2 } from "lucide-react";
import { searchIndexService, type IndexedSearchResult } from "@/services";
import { contentLoader } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { usePagination } from "@/shared/hooks/usePagination";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

// Configuration
const ITEMS_PER_PAGE = 24;
const VIRTUAL_ITEM_HEIGHT = 88;

const CONTENT_TYPE_CONFIG: Record<IndexedSearchResult['type'], { label: string; icon: typeof Users; color: string; bgColor: string }> = {
  character: { label: 'Characters', icon: Users, color: 'text-tec', bgColor: 'bg-tec/10' },
  swimsuit: { label: 'Swimsuits', icon: Sparkles, color: 'text-secondary', bgColor: 'bg-secondary/10' },
  event: { label: 'Events', icon: Calendar, color: 'text-ssr', bgColor: 'bg-ssr/10' },
  gacha: { label: 'Gachas', icon: Gift, color: 'text-apl', bgColor: 'bg-apl/10' },
  guide: { label: 'Guides', icon: BookOpen, color: 'text-stm', bgColor: 'bg-stm/10' },
  item: { label: 'Items', icon: Package, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  episode: { label: 'Episodes', icon: Film, color: 'text-orange-500', bgColor: 'bg-orange-500/15' },
};

const CONTENT_TYPE_ORDER: IndexedSearchResult['type'][] = ['character', 'swimsuit', 'event', 'gacha', 'guide', 'item', 'episode'];

type SortOption = 'relevance' | 'a-z' | 'z-a';
type FilterType = 'all' | IndexedSearchResult['type'];

// Memoized search result card
function SearchResultCard({ result, index }: { result: IndexedSearchResult; index: number }) {
  const config = CONTENT_TYPE_CONFIG[result.type];
  const Icon = config.icon;

  return (
    <Link to={result.url}>
      <Card
        className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${Math.min(index, 10) * 0.02}s` }}
      >
        <div className="flex items-center gap-4 p-4">
          <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted ring-2 ring-transparent transition-all">
            {result.image ? (
              <img
                src={result.image}
                alt={result.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center", config.bgColor)}>
                <Icon className={cn("h-8 w-8", config.color)} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {result.title}
              </h3>
              {result.badge && (
                <Badge variant={result.badgeVariant} className="flex-shrink-0 text-xs">
                  {result.badge}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", config.bgColor, config.color)}>
                <Icon className="h-3 w-3" />
                {config.label.slice(0, -1)}
              </div>
              {result.subtitle && (
                <span className="text-sm text-muted-foreground truncate">{result.subtitle}</span>
              )}
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </Card>
    </Link>
  );
}

// Type filter chip component
function TypeFilterChip({ 
  type, 
  count, 
  isActive, 
  onClick 
}: { 
  type: FilterType; 
  count: number; 
  isActive: boolean; 
  onClick: () => void;
}) {
  if (type === 'all') {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        )}
      >
        All
        <Badge variant="secondary" className={cn("h-5", isActive && "bg-primary-foreground/20 text-primary-foreground")}>
          {count}
        </Badge>
      </button>
    );
  }

  const config = CONTENT_TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        isActive 
          ? cn(config.bgColor, config.color, "shadow-md ring-2 ring-current/20")
          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {config.label}
      <Badge variant="secondary" className="h-5">
        {count}
      </Badge>
    </button>
  );
}

// Virtualized results list for large datasets
function VirtualizedResults({ 
  results, 
  containerHeight = 600 
}: { 
  results: IndexedSearchResult[];
  containerHeight?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate row count for 2-column grid on md+
  const isMd = typeof window !== 'undefined' && window.innerWidth >= 768;
  const columns = isMd ? 2 : 1;
  const rowCount = Math.ceil(results.length / columns);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ITEM_HEIGHT + 16,
    overscan: 5,
  });

  if (results.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = results.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className={cn(
                "absolute top-0 left-0 w-full grid gap-4",
                columns === 2 ? "grid-cols-2" : "grid-cols-1"
              )}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              {rowItems.map((result, colIndex) => (
                <SearchResultCard 
                  key={`${result.type}-${result.id}`} 
                  result={result} 
                  index={startIndex + colIndex} 
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Paginated results for standard pagination
function PaginatedResults({ 
  results, 
  pagination 
}: { 
  results: IndexedSearchResult[];
  pagination: ReturnType<typeof usePagination>;
}) {
  const paginatedResults = results.slice(pagination.startIndex, pagination.endIndex);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        {paginatedResults.map((result, idx) => (
          <SearchResultCard 
            key={`${result.type}-${result.id}`} 
            result={result} 
            index={idx} 
          />
        ))}
      </div>

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
    </>
  );
}

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  const searchQuery = searchParams.get("q") || "";
  useDocumentTitle(searchQuery ? `${t('searchResults.title')}: ${searchQuery}` : t('searchResults.title'));
  
  // State
  const [loading, setLoading] = useState(true);
  const [indexReady, setIndexReady] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [displayMode, setDisplayMode] = useState<'pagination' | 'virtual'>('pagination');
  
  // Debounced query for search
  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;

  // Initialize content and search index
  useEffect(() => {
    async function initialize() {
      setLoading(true);
      
      // Load content first
      await contentLoader.initialize();
      
      // Build search indexes
      await searchIndexService.buildIndexes();
      setIndexReady(true);
      
      setLoading(false);
    }
    initialize();
  }, []);

  // Sync query from URL (only when URL changes externally, not from user input)
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setQuery(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Search results using FlexSearch (O(1) performance)
  const searchResults = useMemo(() => {
    if (!indexReady || !deferredQuery.trim()) {
      return { results: [], total: 0, hasMore: false, searchTime: 0 };
    }

    const types = filterType === 'all' 
      ? CONTENT_TYPE_ORDER 
      : [filterType];

    return searchIndexService.search(deferredQuery, {
      limit: 10000, // Get all results for client-side filtering/sorting
      types,
      language: currentLanguage,
    });
  }, [deferredQuery, filterType, currentLanguage, indexReady]);

  // Sort results
  const sortedResults = useMemo(() => {
    const results = [...searchResults.results];

    if (sortBy === 'a-z') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'z-a') {
      results.sort((a, b) => b.title.localeCompare(a.title));
    }

    return results;
  }, [searchResults.results, sortBy]);

  // Type counts for filter chips
  const typeCounts = useMemo(() => {
    if (!indexReady || !deferredQuery.trim()) {
      return { all: 0, character: 0, swimsuit: 0, event: 0, gacha: 0, guide: 0, item: 0, episode: 0 };
    }
    return searchIndexService.getTypeCounts(deferredQuery);
  }, [deferredQuery, indexReady]);

  // Pagination
  const pagination = usePagination({
    totalItems: sortedResults.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset pagination when filter or query changes
  useEffect(() => {
    pagination.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, deferredQuery]);

  // Switch to virtual mode for large datasets
  useEffect(() => {
    setDisplayMode(sortedResults.length > 100 ? 'virtual' : 'pagination');
  }, [sortedResults.length]);

  // Handlers
  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  }, [query, setSearchParams]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
  }, [handleSearchSubmit]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchParams({});
  }, [setSearchParams]);

  const handleFilterChange = useCallback((type: FilterType) => {
    setFilterType(type);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading search index...</p>
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
          <Breadcrumb items={[{ label: t('searchResults.breadcrumb') }]} />

          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
              {t('searchResults.title')}
            </h1>
            {searchQuery && (
              <p className="text-base sm:text-lg text-muted-foreground">
                {t('searchResults.found')
                  .replace('{count}', sortedResults.length.toString())
                  .replace('{query}', searchQuery)}
                {searchResults.searchTime > 0 && (
                  <span className="text-xs ml-2 opacity-60">
                    ({searchResults.searchTime.toFixed(1)}ms)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('searchResults.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 pl-12 pr-10 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {query && (
                  <button 
                    onClick={clearSearch} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearchSubmit} size="lg" className="h-12 px-6 rounded-xl">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('searchResults.searchBtn')
                )}
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mb-6 overflow-x-auto pt-1 pb-3">
            <div className="flex items-center gap-2 min-w-max">
              <TypeFilterChip 
                type="all" 
                count={typeCounts.all} 
                isActive={filterType === 'all'} 
                onClick={() => handleFilterChange('all')} 
              />
              {CONTENT_TYPE_ORDER.map((type) => (
                typeCounts[type] > 0 && (
                  <TypeFilterChip 
                    key={type} 
                    type={type} 
                    count={typeCounts[type]} 
                    isActive={filterType === type} 
                    onClick={() => handleFilterChange(type)} 
                  />
                )
              ))}
            </div>
          </div>

          {/* Sort & Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {t('searchResults.showing').replace('{count}', sortedResults.length.toString())}
              </p>
              {sortedResults.length > 100 && (
                <Badge variant="outline" className="text-xs">
                  Virtual Scroll
                </Badge>
              )}
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border/50">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('filter.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t('sort.relevance')}</SelectItem>
                <SelectItem value="a-z">{t('sort.az')}</SelectItem>
                <SelectItem value="z-a">{t('sort.za')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {!searchQuery ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg text-muted-foreground mb-2">
                {t('searchResults.enterSearch')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('searchResults.searchHint')}
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {t('searchResults.noResults')}
              </p>
              <p className="text-muted-foreground">
                {t('searchResults.tryDifferent')}
              </p>
            </div>
          ) : displayMode === 'virtual' ? (
            <VirtualizedResults results={sortedResults} containerHeight={600} />
          ) : (
            <PaginatedResults results={sortedResults} pagination={pagination} />
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default SearchResultsPage;
