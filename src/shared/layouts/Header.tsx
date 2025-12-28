import { Search, Command } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { DesktopNavigation, MobileNavigation } from "@/shared/layouts/navigation";
import { navigationGroups } from "@/shared/config/navigation";
import { SearchDropdown, getFlattenedResults } from "@/features/search/components";
import { searchService, type SearchResult, type SearchResults } from "@/services";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { useRecentSearches } from "@/shared/hooks/useRecentSearches";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const emptyResults: SearchResults = {
  characters: [], swimsuits: [], events: [], gachas: [], guides: [], items: [], episodes: [], tools: [], accessories: [], missions: [], quizzes: [], total: 0,
};

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResults>(emptyResults);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const flattenedResults = useMemo(() => getFlattenedResults(results), [results]);

  const isHomePage = location.pathname === "/";
  const isSearchPage = location.pathname === "/search";
  const showSearch = !isHomePage && !isSearchPage;

  // Recent searches management (Requirements: 6.1, 6.2, 6.3, 6.4)
  const { searches: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Translate navigation groups - memoized for performance
  const translatedGroups = useMemo(() => navigationGroups.map(group => ({
    ...group,
    label: t(`nav.${group.label.toLowerCase()}`),
    items: group.items.map(item => ({
      ...item,
      label: t(`nav.${item.label.toLowerCase()}`),
    }))
  })), [t]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(emptyResults);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    searchService.searchAsync(debouncedQuery).then(searchResults => {
      setResults(searchResults);
      setIsLoading(false);
      setFocusedIndex(-1);
    });
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts for search (Cmd/Ctrl+K to focus, Escape to close)
  // Requirements: 5.1, 5.2
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      action: () => {
        if (showSearch && inputRef.current) {
          inputRef.current.focus();
          setSearchOpen(true);
        }
      },
    },
    {
      key: 'Escape',
      action: () => {
        setSearchOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
      },
    },
  ]);

  const handleSelect = useCallback((result: SearchResult) => {
    setSearchOpen(false);
    setQuery('');
    navigate(result.url);
  }, [navigate]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      addSearch(query.trim());
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, addSearch, navigate]);

  const handleRecentSearchSelect = useCallback((search: string) => {
    setQuery(search);
    addSearch(search);
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(search)}`);
  }, [addSearch, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchOpen) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }

    // Determine the list length based on whether we're showing results or recent searches
    const isShowingRecentSearches = !query.trim() && recentSearches.length > 0;
    const listLength = isShowingRecentSearches ? recentSearches.length : flattenedResults.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, listLength - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (isShowingRecentSearches && focusedIndex >= 0 && focusedIndex < recentSearches.length) {
          handleRecentSearchSelect(recentSearches[focusedIndex]);
        } else if (focusedIndex >= 0 && focusedIndex < flattenedResults.length) {
          handleSelect(flattenedResults[focusedIndex]);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        {t('a11y.skipToMain')}
      </a>
      <header 
        role="banner"
        className={cn(
          "sticky top-0 z-50 w-full",
          "border-b border-border/30",
          "bg-background/90 backdrop-blur-xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-background/85",
          "transition-all duration-300"
        )}
      >
        {/* Subtle gradient accent line at top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          {/* Logo with enhanced styling */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className={cn(
              "group flex items-center gap-2.5",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-xl",
              "transition-all duration-200"
            )}
          >
            <div className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-primary via-primary to-secondary/80",
              "shadow-md shadow-primary/20",
              "group-hover:shadow-lg group-hover:shadow-primary/30",
              "group-hover:scale-105 transition-all duration-200"
            )}>
              <img src="/favicon.ico" alt="Logo" className="h-6 w-6 drop-shadow-sm" />
              {/* Subtle shine effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
            </div>
            <span className={cn(
              "text-xl font-bold hidden sm:inline",
              "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
              "group-hover:from-primary group-hover:to-secondary",
              "transition-all duration-200"
            )}>
              {t('app.title')}
            </span>
            <span className={cn(
              "text-xl font-bold sm:hidden",
              "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text"
            )}>
              {t('app.titleShort')}
            </span>
          </a>

          <DesktopNavigation groups={translatedGroups} />

          <div className="flex items-center gap-1.5">
            {showSearch && (
              <div ref={containerRef} className="relative">
                {/* Desktop Search - Premium Style */}
                <div className="hidden lg:flex relative">
                  <div className={cn(
                    "relative flex items-center",
                    "rounded-xl border transition-all duration-200",
                    searchFocused 
                      ? "border-primary/50 bg-background shadow-lg shadow-primary/10" 
                      : "border-border/40 bg-muted/40 hover:bg-muted/60 hover:border-border/60"
                  )}>
                    <Search className={cn(
                      "absolute left-3 h-4 w-4 pointer-events-none transition-colors duration-200",
                      searchFocused ? "text-primary" : "text-muted-foreground"
                    )} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSearchOpen(true);
                        if (e.target.value.trim()) setIsLoading(true);
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        setSearchOpen(true);
                        setSearchFocused(true);
                      }}
                      onBlur={() => setSearchFocused(false)}
                      placeholder={t('search.placeholder')}
                      className={cn(
                        "h-10 w-56 xl:w-64 pl-9 pr-16 bg-transparent text-sm",
                        "placeholder:text-muted-foreground/70",
                        "focus:outline-none",
                        "transition-all duration-200"
                      )}
                    />
                    {/* Keyboard shortcut hint */}
                    <div className={cn(
                      "absolute right-2 flex items-center gap-1 pointer-events-none",
                      "text-[10px] text-muted-foreground/60",
                      searchFocused && "opacity-0"
                    )}>
                      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/80 border border-border/50 font-medium">
                        <Command className="h-2.5 w-2.5" />
                        <span>K</span>
                      </kbd>
                    </div>
                  </div>
                  <SearchDropdown
                    query={query}
                    results={results}
                    isOpen={searchOpen && (query.trim().length > 0 || recentSearches.length > 0)}
                    isLoading={isLoading}
                    onClose={() => setSearchOpen(false)}
                    onSelect={handleSelect}
                    focusedIndex={focusedIndex}
                    onFocusChange={setFocusedIndex}
                    className="w-[420px] left-1/2 -translate-x-1/2"
                    recentSearches={recentSearches}
                    onRecentSearchClick={handleRecentSearchSelect}
                    onClearRecentSearches={clearSearches}
                    onRemoveRecentSearch={removeSearch}
                  />
                </div>

                {/* Mobile Search Button - Premium Style */}
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "lg:hidden min-h-[44px] min-w-[44px] rounded-xl",
                    "hover:bg-primary/10 hover:text-primary",
                    "transition-all duration-200"
                  )}
                  onClick={() => navigate('/search')}
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            )}

            <ThemeToggle />
            <LanguageSwitcher />
            <MobileNavigation groups={translatedGroups} open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
