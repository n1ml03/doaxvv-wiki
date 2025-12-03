/**
 * URL Serialization Utilities for Unified Filter
 * 
 * This module provides functions to serialize filter state to URL parameters
 * and deserialize URL parameters back to filter state.
 */

import { DEFAULT_FILTER_STATE, type UnifiedFilterState } from './types';

// URL parameter keys
const URL_KEYS = {
  search: 'q',
  category: 'category',
  tags: 'tags',
  sort: 'sort',
  rarity: 'rarity',
  status: 'status',
  type: 'type',
  dateStart: 'startDate',
  dateEnd: 'endDate',
  statRanges: 'stats',
  booleanFilters: 'flags',
} as const;

/**
 * Serializes a UnifiedFilterState to URLSearchParams
 * Only includes non-default values to keep URLs clean
 * 
 * @param state - The filter state to serialize
 * @returns URLSearchParams with the serialized state
 */
export function serializeFilterState(state: UnifiedFilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Search
  if (state.search && state.search.trim() !== '') {
    params.set(URL_KEYS.search, state.search);
  }

  // Category
  if (state.category && state.category !== 'All') {
    params.set(URL_KEYS.category, state.category);
  }

  // Tags
  if (state.tags && state.tags.length > 0) {
    params.set(URL_KEYS.tags, state.tags.join(','));
  }

  // Sort
  if (state.sort && state.sort !== DEFAULT_FILTER_STATE.sort) {
    params.set(URL_KEYS.sort, state.sort);
  }

  // Rarity
  if (state.rarity && state.rarity !== 'All') {
    params.set(URL_KEYS.rarity, state.rarity);
  }

  // Status
  if (state.status && state.status !== 'All') {
    params.set(URL_KEYS.status, state.status);
  }

  // Type
  if (state.type && state.type !== 'All') {
    params.set(URL_KEYS.type, state.type);
  }

  // Date Range
  if (state.dateRange) {
    if (state.dateRange.start) {
      params.set(URL_KEYS.dateStart, state.dateRange.start);
    }
    if (state.dateRange.end) {
      params.set(URL_KEYS.dateEnd, state.dateRange.end);
    }
  }

  // Stat Ranges - serialize as JSON
  if (state.statRanges && Object.keys(state.statRanges).length > 0) {
    try {
      params.set(URL_KEYS.statRanges, JSON.stringify(state.statRanges));
    } catch {
      // Ignore serialization errors
    }
  }

  // Boolean Filters - serialize as JSON
  const activeBooleans = Object.entries(state.booleanFilters || {})
    .filter(([, value]) => value === true)
    .reduce((acc, [key]) => ({ ...acc, [key]: true }), {});
  
  if (Object.keys(activeBooleans).length > 0) {
    try {
      params.set(URL_KEYS.booleanFilters, JSON.stringify(activeBooleans));
    } catch {
      // Ignore serialization errors
    }
  }

  return params;
}

/**
 * Deserializes URLSearchParams to a partial UnifiedFilterState
 * Returns only the fields that were present in the URL
 * Falls back to default values for invalid data
 * 
 * @param params - The URLSearchParams to deserialize
 * @returns Partial filter state with values from URL
 */
export function deserializeFilterState(params: URLSearchParams): Partial<UnifiedFilterState> {
  const state: Partial<UnifiedFilterState> = {};

  // Search
  const search = params.get(URL_KEYS.search);
  if (search !== null) {
    state.search = search;
  }

  // Category
  const category = params.get(URL_KEYS.category);
  if (category !== null) {
    state.category = category || 'All';
  }

  // Tags
  const tags = params.get(URL_KEYS.tags);
  if (tags !== null) {
    state.tags = tags ? tags.split(',').filter(Boolean) : [];
  }

  // Sort
  const sort = params.get(URL_KEYS.sort);
  if (sort !== null) {
    state.sort = sort || DEFAULT_FILTER_STATE.sort;
  }

  // Rarity
  const rarity = params.get(URL_KEYS.rarity);
  if (rarity !== null) {
    state.rarity = rarity || 'All';
  }

  // Status
  const status = params.get(URL_KEYS.status);
  if (status !== null) {
    state.status = status || 'All';
  }

  // Type
  const type = params.get(URL_KEYS.type);
  if (type !== null) {
    state.type = type || 'All';
  }

  // Date Range
  const dateStart = params.get(URL_KEYS.dateStart);
  const dateEnd = params.get(URL_KEYS.dateEnd);
  if (dateStart !== null || dateEnd !== null) {
    const start = dateStart || '';
    const end = dateEnd || '';
    // Only set dateRange if at least one date is valid
    if (start || end) {
      state.dateRange = { start, end };
    } else {
      state.dateRange = null;
    }
  }

  // Stat Ranges
  const statRangesStr = params.get(URL_KEYS.statRanges);
  if (statRangesStr !== null) {
    try {
      const parsed = JSON.parse(statRangesStr);
      if (isValidStatRanges(parsed)) {
        state.statRanges = parsed;
      } else {
        state.statRanges = {};
      }
    } catch {
      // Invalid JSON, use default
      state.statRanges = {};
    }
  }

  // Boolean Filters
  const booleanFiltersStr = params.get(URL_KEYS.booleanFilters);
  if (booleanFiltersStr !== null) {
    try {
      const parsed = JSON.parse(booleanFiltersStr);
      if (isValidBooleanFilters(parsed)) {
        state.booleanFilters = parsed;
      } else {
        state.booleanFilters = {};
      }
    } catch {
      // Invalid JSON, use default
      state.booleanFilters = {};
    }
  }

  return state;
}

/**
 * Validates that a parsed value is a valid stat ranges object
 */
function isValidStatRanges(value: unknown): value is Record<string, [number, number]> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  for (const [key, range] of Object.entries(value)) {
    if (typeof key !== 'string') {
      return false;
    }
    if (!Array.isArray(range) || range.length !== 2) {
      return false;
    }
    if (typeof range[0] !== 'number' || typeof range[1] !== 'number') {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates that a parsed value is a valid boolean filters object
 */
function isValidBooleanFilters(value: unknown): value is Record<string, boolean> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  for (const [key, val] of Object.entries(value)) {
    if (typeof key !== 'string') {
      return false;
    }
    if (typeof val !== 'boolean') {
      return false;
    }
  }
  
  return true;
}

/**
 * Merges deserialized URL state with default state
 * 
 * @param urlState - Partial state from URL
 * @param defaultState - Default state to use for missing values
 * @returns Complete filter state
 */
export function mergeWithDefaults(
  urlState: Partial<UnifiedFilterState>,
  defaultState: UnifiedFilterState = DEFAULT_FILTER_STATE
): UnifiedFilterState {
  return {
    search: urlState.search ?? defaultState.search,
    category: urlState.category ?? defaultState.category,
    tags: urlState.tags ?? defaultState.tags,
    sort: urlState.sort ?? defaultState.sort,
    rarity: urlState.rarity ?? defaultState.rarity,
    status: urlState.status ?? defaultState.status,
    type: urlState.type ?? defaultState.type,
    dateRange: urlState.dateRange !== undefined ? urlState.dateRange : defaultState.dateRange,
    statRanges: urlState.statRanges ?? defaultState.statRanges,
    booleanFilters: urlState.booleanFilters ?? defaultState.booleanFilters,
  };
}
