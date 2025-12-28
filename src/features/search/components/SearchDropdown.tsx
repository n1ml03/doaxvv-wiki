/**
 * SearchDropdown Component
 * Modern dropdown with grouped results, animations, and keyboard navigation
 * Supports recent searches display when no query is entered
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, BookOpen, Clock, X } from "lucide-react";
import type { SearchResult, SearchResults } from "@/services";
import { CONTENT_TYPE_CONFIG, CONTENT_TYPE_ORDER, getFlattenedResults, getResultsByType } from "./search-dropdown-utils";
import { DatasetImage } from "@/shared/components";
import { useTranslation } from "@/shared/hooks/useTranslation";

export interface SearchDropdownProps {
  query: string;
  results: SearchResults;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  className?: string;
  /** Recent search queries to display when no query is entered */
  recentSearches?: string[];
  /** Callback when a recent search is clicked */
  onRecentSearchClick?: (query: string) => void;
  /** Callback to clear all recent searches */
  onClearRecentSearches?: () => void;
  /** Callback to remove a single recent search */
  onRemoveRecentSearch?: (query: string) => void;
}

interface SearchResultItemProps {
  result: SearchResult;
  isFocused: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function SearchResultItem({ result, isFocused, onClick, onMouseEnter }: SearchResultItemProps) {
  const config = CONTENT_TYPE_CONFIG[result.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center gap-4 p-3 text-left transition-all duration-200 rounded-lg mx-1",
        "hover:bg-accent/50 focus:outline-none group",
        isFocused && "bg-accent"
      )}
    >
      {/* Image with fallback icon */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
        {result.image ? (
          <DatasetImage
            src={result.image}
            alt={result.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {result.title}
          </p>
          {result.badge && (
            <Badge variant={result.badgeVariant} className="flex-shrink-0 text-xs h-5">
              {result.badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Icon className={cn("h-3 w-3", config.color)} />
          <span className="text-xs text-muted-foreground capitalize">
            {result.type}
          </span>
          {result.subtitle && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs text-muted-foreground truncate">
                {result.subtitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <ArrowRight className={cn(
        "h-4 w-4 text-muted-foreground/50 transition-all duration-200",
        "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
        isFocused && "opacity-100 translate-x-0 text-primary"
      )} />
    </button>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-foreground font-medium mb-1">
        {t('search.noResults')} "{query}"
      </p>
      <p className="text-sm text-muted-foreground">
        {t('search.trySearching')}
      </p>
    </div>
  );
}

export function SearchDropdown({
  query,
  results,
  isOpen,
  isLoading,
  onClose,
  onSelect,
  focusedIndex,
  onFocusChange,
  className,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches,
  onRemoveRecentSearch,
}: SearchDropdownProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const flattenedResults = getFlattenedResults(results);
  const hasRecentSearches = recentSearches.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50",
          "animate-dropdown-in origin-top",
          className
        )}
      >
        <div className="p-2">
          {[1, 2, 3].map((i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (results.total === 0 && query.trim()) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50",
          "animate-dropdown-in origin-top",
          className
        )}
      >
        <EmptyState query={query} />
      </div>
    );
  }

  // Show recent searches when no query and recent searches exist
  // Requirements: 6.2, 6.3, 6.4
  if (!query.trim() && hasRecentSearches) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50",
          "animate-dropdown-in origin-top",
          className
        )}
      >
        <div className="p-2">
          {/* Recent searches header */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('search.recentSearches')}
              </span>
            </div>
            {onClearRecentSearches && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearRecentSearches();
                }}
              >
                {t('search.clearAll')}
              </Button>
            )}
          </div>

          {/* Recent search items */}
          <div className="space-y-0.5">
            {recentSearches.map((search, index) => (
              <div
                key={search}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg mx-1 group",
                  "hover:bg-accent/50 transition-all duration-200",
                  focusedIndex === index && "bg-accent"
                )}
              >
                <button
                  type="button"
                  className="flex-1 flex items-center gap-3 text-left"
                  onClick={() => onRecentSearchClick?.(search)}
                  onMouseEnter={() => onFocusChange(index)}
                >
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{search}</span>
                </button>
                {onRemoveRecentSearch && (
                  <button
                    type="button"
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecentSearch(search);
                    }}
                    aria-label={`Remove "${search}" from recent searches`}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with hint */}
        <div className="border-t border-border/50 px-4 py-2.5 bg-muted/30">
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
              {' '}{t('search.hint.select')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Don't show dropdown if no query and no recent searches
  if (!query.trim()) return null;

  return (
    <div
      className={cn(
          "absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50",
          "animate-dropdown-in origin-top",
          className
      )}
    >
      <div className="max-h-[420px] overflow-y-auto p-2">
        {CONTENT_TYPE_ORDER.map((type) => {
          const typeResults = getResultsByType(results, type);
          if (typeResults.length === 0) return null;

          const config = CONTENT_TYPE_CONFIG[type];
          const Icon = config.icon;

          return (
            <div key={type} className="mb-2 last:mb-0">
              {/* Section header */}
              <div className="flex items-center gap-2 px-3 py-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(`search.type.${type}`)}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs h-5">
                  {typeResults.length}
                </Badge>
              </div>

              {/* Results */}
              <div className="space-y-0.5">
                {typeResults.map((result) => {
                  const globalIndex = flattenedResults.findIndex(
                    (r) => r.id === result.id && r.type === result.type
                  );
                  return (
                    <SearchResultItem
                      key={`${result.type}-${result.id}`}
                      result={result}
                      isFocused={focusedIndex === globalIndex}
                      onClick={() => onSelect(result)}
                      onMouseEnter={() => onFocusChange(globalIndex)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with hint */}
      <div className="border-t border-border/50 px-4 py-2.5 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">↑↓</kbd>
            {' '}{t('search.hint.navigate')}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
            {' '}{t('search.hint.select')}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd>
            {' '}{t('search.hint.close')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SearchDropdown;
