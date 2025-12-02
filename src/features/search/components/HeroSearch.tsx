/**
 * HeroSearch Component
 * Modern search interface with animated dropdown and keyboard navigation
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Users, Calendar, Gift, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import SearchDropdown from './SearchDropdown';
import { getFlattenedResults } from './search-dropdown-utils';
import { searchService, type SearchResult, type SearchResults } from '@/services';
import { cn } from '@/lib/utils';

export interface HeroSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const quickSearches = [
  { label: 'Characters', icon: Users, query: 'character' },
  { label: 'Events', icon: Calendar, query: 'event' },
  { label: 'Gachas', icon: Gift, query: 'gacha' },
  { label: 'Guides', icon: BookOpen, query: 'guide' },
];

/**
 * HeroSearch Component
 * Main search component for the Hero section with dropdown results
 */
export function HeroSearch({ placeholder = 'Search characters, events, swimsuits...', onSearch }: HeroSearchProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    characters: [],
    swimsuits: [],
    events: [],
    gachas: [],
    guides: [],
    items: [],
    episodes: [],
    total: 0,
  });

  const debouncedQuery = useDebounce(query, 300);
  const flattenedResults = useMemo(() => getFlattenedResults(results), [results]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({
        characters: [],
        swimsuits: [],
        events: [],
        gachas: [],
        guides: [],
        items: [],
        episodes: [],
        total: 0,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const searchResults = searchService.search(debouncedQuery);
    setResults(searchResults);
    setIsLoading(false);
    setFocusedIndex(-1);
  }, [debouncedQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    if (value.trim()) {
      setIsLoading(true);
    }
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.url);
  }, [navigate]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      setIsOpen(false);
      onSearch?.(query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter') {
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const maxIndex = flattenedResults.length - 1;
          return prev < maxIndex ? prev + 1 : prev;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flattenedResults.length) {
          handleSelect(flattenedResults[focusedIndex]);
        } else {
          handleSubmit();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.focus();
        break;
    }
  }, [isOpen, focusedIndex, flattenedResults, handleSelect, handleSubmit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFocusChange = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const handleQuickSearch = useCallback((searchQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  }, [navigate]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Backdrop overlay to block clicks when dropdown is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setFocusedIndex(-1);
          }}
        />
      )}
      {/* Main Search Container */}
      <div 
        ref={containerRef} 
        className={cn(
          "relative transition-all duration-300 z-50",
          isFocused && "scale-[1.02]"
        )}
      >
        <div className={cn(
          "relative flex items-center gap-2 bg-background/95 backdrop-blur-xl rounded-2xl shadow-lg border-2 transition-all duration-300",
          isFocused ? "border-primary/50 shadow-xl shadow-primary/10" : "border-transparent"
        )}>
          {/* Search Icon with Animation */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className={cn(
              "h-5 w-5 transition-colors duration-300",
              isFocused ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim()) {
                setIsOpen(true);
                // Re-trigger search to ensure fresh results when refocusing
                setIsLoading(true);
                const searchResults = searchService.search(query);
                setResults(searchResults);
                setIsLoading(false);
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 h-14 sm:h-16 pl-14 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground text-base sm:text-lg outline-none focus:outline-none focus:ring-0"
            aria-label="Search"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="search-dropdown"
            autoComplete="off"
          />
          
          {/* Search Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            size="lg"
            className="h-10 sm:h-12 px-4 sm:px-6 mr-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 group"
          >
            <span className="hidden sm:inline">Search</span>
            <ArrowRight className="h-4 w-4 sm:ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        
        {/* Search Dropdown */}
        <SearchDropdown
          query={query}
          results={results}
          isOpen={isOpen}
          isLoading={isLoading}
          onClose={handleClose}
          onSelect={handleSelect}
          focusedIndex={focusedIndex}
          onFocusChange={handleFocusChange}
        />
      </div>
      
      {/* Quick Search Tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-white/70 text-sm flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          Quick:
        </span>
        {quickSearches.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleQuickSearch(item.query)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HeroSearch;
