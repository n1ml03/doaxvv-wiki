/**
 * Unified Filter Component Types
 * 
 * This module defines all TypeScript interfaces and types for the unified filter system.
 */

import type { ReactNode } from 'react';

// ============ Filter Option Types ============

/**
 * Represents a single filter option (for dropdowns, tags, etc.)
 */
export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

/**
 * Represents a range filter configuration (for numeric sliders)
 */
export interface RangeFilter {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
}

/**
 * Represents a date range filter configuration
 */
export interface DateRangeFilter {
  key: string;
  label: string;
}

/**
 * Represents a boolean filter configuration
 */
export interface BooleanFilter {
  key: string;
  label: string;
}

// ============ Filter State ============

/**
 * The complete state of all filters
 */
export interface UnifiedFilterState {
  search: string;
  category: string;
  tags: string[];
  sort: string;
  rarity: string;
  status: string;
  type: string;
  dateRange: { start: string; end: string } | null;
  statRanges: Record<string, [number, number]>;
  booleanFilters: Record<string, boolean>;
}

/**
 * Default filter state values
 */
export const DEFAULT_FILTER_STATE: UnifiedFilterState = {
  search: '',
  category: 'All',
  tags: [],
  sort: 'newest',
  rarity: 'All',
  status: 'All',
  type: 'All',
  dateRange: null,
  statRanges: {},
  booleanFilters: {},
};

// ============ Preset Types ============

/**
 * Available filter presets for different page types
 */
export type FilterPreset =
  | 'characters'
  | 'swimsuits'
  | 'events'
  | 'festivals'
  | 'gachas'
  | 'items'
  | 'guides'
  | 'episodes'
  | 'accessories'
  | 'missions'
  | 'quizzes'
  | 'default';

/**
 * Configuration for a filter preset
 */
export interface PresetConfig {
  sortOptions: FilterOption[];
  rarities?: FilterOption[];
  statuses?: FilterOption[];
  types?: FilterOption[];
  rangeFilters?: RangeFilter[];
  booleanFilters?: BooleanFilter[];
  dateRangeFilter?: DateRangeFilter;
  defaultSort?: string;
}

// ============ Resolved Configuration ============

/**
 * The fully resolved filter configuration (preset + custom merged)
 */
export interface ResolvedFilterConfig {
  sortOptions: FilterOption[];
  rarities: FilterOption[];
  statuses: FilterOption[];
  types: FilterOption[];
  rangeFilters: RangeFilter[];
  booleanFilters: BooleanFilter[];
  dateRangeFilter: DateRangeFilter | null;
  hasAdvancedFilters: boolean;
}

// ============ Hook Options ============

/**
 * Options for the useUnifiedFilter hook
 */
export interface UseUnifiedFilterOptions<T> {
  /** Preset configuration to use */
  preset: FilterPreset;

  /** Data array to filter */
  data: T[];

  /** Fields to search in (can be key names or accessor functions) */
  searchFields?: (keyof T | ((item: T) => string))[];

  /** Field to use for category filtering */
  categoryField?: keyof T;

  /** Field to use for tag filtering (can be key name or accessor function) */
  tagField?: keyof T | ((item: T) => string[]);

  /** Field to use for rarity filtering */
  rarityField?: keyof T;

  /** Field to use for status filtering */
  statusField?: keyof T;

  /** Field to use for type filtering */
  typeField?: keyof T;

  /** Field(s) to use for date filtering */
  dateField?: keyof T | { start: keyof T; end: keyof T };

  /** Custom filter options to merge with preset */
  customFilters?: FilterOption[];

  /** Custom sort functions */
  customSortFunctions?: Record<string, (a: T, b: T) => number>;

  /** Custom filter function to apply in addition to standard filters */
  customFilterFn?: (item: T, state: UnifiedFilterState) => boolean;

  /** Custom search function to use instead of default */
  customSearchFn?: (item: T, searchTerm: string) => boolean;

  /** Whether to sync filter state to URL (default: true) */
  syncToUrl?: boolean;

  /** Default sort option */
  defaultSort?: string;
}

// ============ Filter Handlers ============

/**
 * Handler functions for updating filter state
 */
export interface FilterHandlers {
  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setTags: (value: string[]) => void;
  toggleTag: (tag: string) => void;
  setSort: (value: string) => void;
  setRarity: (value: string) => void;
  setStatus: (value: string) => void;
  setType: (value: string) => void;
  setDateRange: (value: { start: string; end: string } | null) => void;
  setStatRange: (key: string, value: [number, number]) => void;
  setBooleanFilter: (key: string, value: boolean) => void;
  clearFilters: () => void;
  clearFilter: (filterKey: keyof UnifiedFilterState, value?: string) => void;
}

// ============ Hook Return Type ============

/**
 * Return type for the useUnifiedFilter hook
 */
export interface UseUnifiedFilterReturn<T> {
  /** Current filter state */
  state: UnifiedFilterState;

  /** Handler functions for updating state */
  handlers: FilterHandlers;

  /** Filtered and sorted data */
  filteredData: T[];

  /** Number of active filters */
  activeFilterCount: number;

  /** Whether any filters are active */
  hasActiveFilters: boolean;

  /** Resolved configuration (preset + custom merged) */
  config: ResolvedFilterConfig;
}
