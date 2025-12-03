// Hooks barrel export
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
export { 
  usePagination, 
  usePaginatedData,
  type UsePaginationOptions,
  type UsePaginationResult,
  type UsePaginatedDataOptions,
  type UsePaginatedDataResult 
} from './usePagination';
export { 
  useKeyboardShortcuts,
  type KeyboardShortcut 
} from './useKeyboardShortcuts';
export { 
  useRecentSearches,
  type UseRecentSearchesReturn 
} from './useRecentSearches';
export { useDocumentTitle } from './useDocumentTitle';

// Unified Filter System
export {
  // Main hook
  useUnifiedFilter,
  
  // Types
  type FilterOption,
  type RangeFilter,
  type DateRangeFilter,
  type BooleanFilter,
  type UnifiedFilterState,
  type FilterPreset,
  type PresetConfig,
  type ResolvedFilterConfig,
  type UseUnifiedFilterOptions,
  type FilterHandlers,
  type UseUnifiedFilterReturn,
  type FilterFn,
  type SortFn,
  type SortConfig,
  type CustomFilterConfig,
  
  // Constants
  DEFAULT_FILTER_STATE,
  
  // URL utilities
  serializeFilterState,
  deserializeFilterState,
  mergeWithDefaults,
  
  // Filter functions
  createSearchFilter,
  createFieldFilter,
  createTagFilter,
  createRangeFilter,
  createDateRangeFilter,
  createBooleanFilter,
  composeFilters,
  
  // Sort functions
  createSortFunction,
  createDateSort,
  createAlphaSort,
  createNumericSort,
  composeSorts,
  
  // Preset utilities
  getDefaultSortOptions,
  getPresetConfig,
  mergeConfigs,
  getResolvedConfig,
} from './useUnifiedFilter';
