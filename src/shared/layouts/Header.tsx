import { Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResults>({
    characters: [], swimsuits: [], events: [], gachas: [], guides: [], items: [], episodes: [], total: 0,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const flattenedResults = getFlattenedResults(results);

  const isHomePage = location.pathname === "/";
  const isSearchPage = location.pathname === "/search";
  const showSearch = !isHomePage && !isSearchPage;

  // Recent searches management (Requirements: 6.1, 6.2, 6.3, 6.4)
  const { searches: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Translate navigation groups
  const translatedGroups = useMemo(() => {
    return navigationGroups.map(group => ({
      ...group,
      label: t(`nav.${group.label.toLowerCase()}`),
      items: group.items.map(item => ({
        ...item,
        label: t(`nav.${item.label.toLowerCase()}`),
      }))
    }));
  }, [t]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ characters: [], swimsuits: [], events: [], gachas: [], guides: [], items: [], episodes: [], total: 0 });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const searchResults = searchService.search(debouncedQuery);
    setResults(searchResults);
    setIsLoading(false);
    setFocusedIndex(-1);
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
      addSearch(query.trim()); // Add to recent searches (Requirement 6.1)
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate, addSearch]);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((search: string) => {
    setQuery(search);
    addSearch(search);
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(search)}`);
  }, [addSearch, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [searchOpen, focusedIndex, flattenedResults, recentSearches, query, handleSelect, handleSubmit, handleRecentSearchSelect]);

  return (
    <>
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        {t('a11y.skipToMain')}
      </a>
      <header 
        role="banner"
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md">
              <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:inline">{t('app.title')}</span>
            <span className="text-xl font-bold text-foreground sm:hidden">{t('app.titleShort')}</span>
          </a>

          <DesktopNavigation groups={translatedGroups} />

          <div className="flex items-center gap-2">
            {showSearch && (
              <div ref={containerRef} className="relative">
                <div className="hidden lg:flex relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
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
                    onFocus={() => setSearchOpen(true)}
                    placeholder={t('search.placeholder')}
                    className={cn(
                      "h-10 w-64 pl-9 pr-3 rounded-lg bg-muted/50 border border-border/50 text-sm",
                      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                      "transition-all duration-200"
                    )}
                  />
                  <SearchDropdown
                    query={query}
                    results={results}
                    isOpen={searchOpen && (query.trim().length > 0 || recentSearches.length > 0)}
                    isLoading={isLoading}
                    onClose={() => setSearchOpen(false)}
                    onSelect={handleSelect}
                    focusedIndex={focusedIndex}
                    onFocusChange={setFocusedIndex}
                    className="w-[400px] left-[calc(50%-200px)]"
                    recentSearches={recentSearches}
                    onRecentSearchClick={(search) => {
                      setQuery(search);
                      addSearch(search);
                      setSearchOpen(false);
                      navigate(`/search?q=${encodeURIComponent(search)}`);
                    }}
                    onClearRecentSearches={clearSearches}
                    onRemoveRecentSearch={removeSearch}
                  />
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="lg:hidden min-h-[44px] min-w-[44px]"
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
