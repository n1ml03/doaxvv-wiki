/**
 * Unified Filter Module
 * 
 * This module exports the useUnifiedFilter hook and all related types,
 * utilities, and functions for the unified filter system.
 */

// ============ Main Hook ============
export { useUnifiedFilter, default } from './useUnifiedFilter';

// ============ Types ============
export {
  // Filter option types
  type FilterOption,
  type RangeFilter,
  type DateRangeFilter,
  type BooleanFilter,
  
  // State types
  type UnifiedFilterState,
  DEFAULT_FILTER_STATE,
  
  // Preset types
  type FilterPreset,
  type PresetConfig,
  
  // Configuration types
  type ResolvedFilterConfig,
  
  // Hook types
  type UseUnifiedFilterOptions,
  type FilterHandlers,
  type UseUnifiedFilterReturn,
} from './types';

// ============ URL Utilities ============
export {
  serializeFilterState,
  deserializeFilterState,
  mergeWithDefaults,
} from './url-utils';

// ============ Filter Functions ============
export {
  type FilterFn,
  type FieldAccessor,
  createSearchFilter,
  createFieldFilter,
  createTagFilter,
  createRangeFilter,
  createDateRangeFilter,
  createBooleanFilter,
  composeFilters,
} from './filter-functions';

// ============ Sort Functions ============
export {
  type SortFn,
  type DefaultSortKey,
  type SortConfig,
  createSortFunction,
  createDateSort,
  createAlphaSort,
  createNumericSort,
  composeSorts,
} from './sort-functions';

// ============ Presets ============
export {
  type CustomFilterConfig,
  getDefaultSortOptions,
  getPresetConfig,
  mergeConfigs,
  getResolvedConfig,
} from './presets';
