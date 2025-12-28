/**
 * PrismCapsuleSearch Component
 * Enhanced search bar wrapper with glassmorphism effects.
 * 
 * Features:
 * - Frosted glass container (bg-white/20, backdrop-blur-xl, border-white/40)
 * - ShimmerEffect sub-component for hover state
 * - GlowBorder sub-component for SSR gradient focus state
 * - Scale-105 transform on focus
 * - Glossy jewel/droplet search button with gradient
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Users, Calendar, Gift, BookOpen, TrendingUp } from 'lucide-react';
import SearchDropdown from '@/features/search/components/SearchDropdown';
import { getFlattenedResults } from '@/features/search/components/search-dropdown-utils';
import { searchService, type SearchResult, type SearchResults } from '@/services';
import { cn } from '@/lib/utils';

export interface PrismCapsuleSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

/**
 * ShimmerEffect Sub-component
 * CSS-based shimmer animation overlay for hover states.
 */
interface ShimmerEffectProps {
  isActive: boolean;
}

function ShimmerEffect({ isActive }: ShimmerEffectProps) {
  if (!isActive) return null;
  
  return (
    <div 
      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
}

/**
 * GlowBorder Sub-component
 * Animated gradient border for focus states (SSR = Blue/Pink/Cyan).
 */
interface GlowBorderProps {
  isActive: boolean;
  gradient?: 'ssr' | 'golden-hour';
}

function GlowBorder({ isActive, gradient = 'ssr' }: GlowBorderProps) {
  if (!isActive) return null;

  const gradientClass = gradient === 'ssr' 
    ? 'bg-gradient-to-r from-blue-400 via-pink-500 to-cyan-400'
    : 'bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400';

  return (
    <div 
      className="absolute -inset-[2px] rounded-full overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Animated gradient border */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full animate-spin-slow",
          gradientClass
        )}
        style={{ 
          animation: 'spin 3s linear infinite',
          filter: 'blur(4px)'
        }}
      />
      {/* Inner mask to create border effect */}
      <div className="absolute inset-[2px] rounded-full bg-white/20 backdrop-blur-xl" />
    </div>
  );
}

/**
 * JewelButton Sub-component
 * Glossy gradient search button styled as a liquid droplet or jewel.
 */
interface JewelButtonProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isFocused: boolean;
}

function JewelButton({ onMouseDown, isFocused }: JewelButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      className={cn(
        "relative h-10 sm:h-12 px-4 sm:px-6 mr-2 rounded-full",
        "bg-primary hover:bg-primary/90",
        "text-primary-foreground font-semibold",
        "shadow-lg shadow-primary/30",
        "transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/40 hover:scale-105",
        "active:scale-95",
        "group overflow-hidden",
        // Glossy highlight effect
        "before:absolute before:inset-0 before:rounded-full",
        "before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-60",
        isFocused && "ring-2 ring-white/50"
      )}
      aria-label="Search"
    >
      {/* Inner glow */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-t from-white/0 to-white/20" />
      
      {/* Button content */}
      <span className="relative flex items-center gap-2">
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
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
 * PrismCapsuleSearch Component
 * Main search component with glassmorphism effects for the Liquid Crystal Hero section.
 */
export function PrismCapsuleSearch({ 
  placeholder = 'Search characters, events, swimsuits...', 
  onSearch 
}: PrismCapsuleSearchProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    characters: [],
    swimsuits: [],
    events: [],
    gachas: [],
    guides: [],
    items: [],
    episodes: [],
    tools: [],
    accessories: [],
    missions: [],
    quizzes: [],
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
        tools: [],
        accessories: [],
        missions: [],
        quizzes: [],
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

  const handleSubmit = useCallback((e?: React.MouseEvent) => {
    // Prevent the input from losing focus when clicking the button
    e?.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
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
    <div className="w-full max-w-3xl mx-auto space-y-6">
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
      
      {/* Main Search Container - Prism Capsule */}
      <div 
        ref={containerRef} 
        className={cn(
          "relative transition-all duration-300 z-50",
          isFocused && "scale-105"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow Border - SSR gradient on focus */}
        <GlowBorder isActive={isFocused} gradient="ssr" />
        
        {/* Frosted Glass Container */}
        <div 
          className={cn(
            "relative flex items-center gap-2 rounded-full",
            "transition-all duration-300",
            // Frosted glass aesthetic (Requirements 2.1)
            "bg-white/20 backdrop-blur-xl border border-white/40",
            // Increased opacity on focus (Requirements 2.4)
            isFocused && "bg-white/30 border-white/60"
          )}
        >
          {/* Shimmer Effect on hover (Requirements 2.2) */}
          <ShimmerEffect isActive={isHovered && !isFocused} />
          
          {/* Search Icon */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className={cn(
              "h-5 w-5 transition-colors duration-300",
              isFocused ? "text-white" : "text-white/70"
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
                setIsLoading(true);
                const searchResults = searchService.search(query);
                setResults(searchResults);
                setIsLoading(false);
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              "flex-1 h-14 sm:h-16 pl-14 pr-4",
              "bg-transparent text-white placeholder:text-white/60",
              "text-base sm:text-lg",
              "outline-none focus:outline-none focus:ring-0"
            )}
            aria-label="Search"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="search-dropdown"
            autoComplete="off"
          />
          
          {/* Jewel Button (Requirements 2.5) */}
          <JewelButton onMouseDown={handleSubmit} isFocused={isFocused} />
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
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
                "text-white text-sm font-medium",
                "transition-all duration-200 hover:scale-105",
                "border border-white/20 hover:border-white/40"
              )}
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

export default PrismCapsuleSearch;
