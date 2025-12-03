/**
 * useUnifiedFilter Hook
 * 
 * A comprehensive hook that manages filter state, URL synchronization,
 * and filtering/sorting logic for list pages.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5, 7.2, 7.3
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type UnifiedFilterState,
  type UseUnifiedFilterOptions,
  type UseUnifiedFilterReturn,
  type FilterHandlers,
  type ResolvedFilterConfig,
  DEFAULT_FILTER_STATE,
} from './types';
import { serializeFilterState, deserializeFilterState, mergeWithDefaults } from './url-utils';
import {
  createSearchFilter,
  createFieldFilter,
  createTagFilter,
  createRangeFilter,
  createDateRangeFilter,
  createBooleanFilter,
  composeFilters,
  type FilterFn,
} from './filter-functions';
import { createSortFunction, type SortConfig } from './sort-functions';
import { getPresetConfig, mergeConfigs } from './presets';
import { useTranslation } from '@/shared/hooks/useTranslation';

/**
 * Main unified filter hook that provides filter state management,
 * URL synchronization, and filtering/sorting logic.
 */
export function useUnifiedFilter<T>(
  options: UseUnifiedFilterOptions<T>
): UseUnifiedFilterReturn<T> {
  const {
    preset,
    data,
    searchFields = [],
    categoryField,
    tagField,
    rarityField,
    statusField,
    typeField,
    dateField,
    customFilters,
    customSortFunctions,
    customFilterFn,
    customSearchFn,
    syncToUrl = true,
    defaultSort,
  } = options;

  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get resolved configuration from preset + custom options
  const config: ResolvedFilterConfig = useMemo(() => {
    const presetConfig = getPresetConfig(preset, t);
    return mergeConfigs(presetConfig, {
      sortOptions: customFilters,
      defaultSort,
    });
  }, [preset, t, customFilters, defaultSort]);

  // Determine the effective default sort
  const effectiveDefaultSort = defaultSort ?? config.sortOptions[0]?.value ?? 'newest';

  // Create the effective default state with the correct default sort
  const effectiveDefaultState = useMemo((): UnifiedFilterState => ({
    ...DEFAULT_FILTER_STATE,
    sort: effectiveDefaultSort,
  }), [effectiveDefaultSort]);

  // Initialize state from URL or defaults
  const [state, setState] = useState<UnifiedFilterState>(() => {
    if (syncToUrl) {
      const urlState = deserializeFilterState(searchParams);
      return mergeWithDefaults(urlState, effectiveDefaultState);
    }
    return effectiveDefaultState;
  });


  // Sync state to URL when it changes
  useEffect(() => {
    if (!syncToUrl) return;

    const params = serializeFilterState(state);
    const currentParams = new URLSearchParams(searchParams);
    
    // Only update if params actually changed
    if (params.toString() !== currentParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [state, syncToUrl, setSearchParams, searchParams]);

  // ============ Handler Functions ============

  const setSearch = useCallback((value: string) => {
    setState(prev => ({ ...prev, search: value }));
  }, []);

  const setCategory = useCallback((value: string) => {
    setState(prev => ({ ...prev, category: value }));
  }, []);

  const setTags = useCallback((value: string[]) => {
    setState(prev => ({ ...prev, tags: value }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setState(prev => {
      const currentTags = prev.tags;
      const hasTag = currentTags.includes(tag);
      return {
        ...prev,
        tags: hasTag
          ? currentTags.filter(t => t !== tag)
          : [...currentTags, tag],
      };
    });
  }, []);

  const setSort = useCallback((value: string) => {
    setState(prev => ({ ...prev, sort: value }));
  }, []);

  const setRarity = useCallback((value: string) => {
    setState(prev => ({ ...prev, rarity: value }));
  }, []);

  const setStatus = useCallback((value: string) => {
    setState(prev => ({ ...prev, status: value }));
  }, []);

  const setType = useCallback((value: string) => {
    setState(prev => ({ ...prev, type: value }));
  }, []);

  const setDateRange = useCallback((value: { start: string; end: string } | null) => {
    setState(prev => ({ ...prev, dateRange: value }));
  }, []);

  const setStatRange = useCallback((key: string, value: [number, number]) => {
    setState(prev => ({
      ...prev,
      statRanges: { ...prev.statRanges, [key]: value },
    }));
  }, []);

  const setBooleanFilter = useCallback((key: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      booleanFilters: { ...prev.booleanFilters, [key]: value },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(effectiveDefaultState);
  }, [effectiveDefaultState]);

  const clearFilter = useCallback((filterKey: keyof UnifiedFilterState, value?: string) => {
    setState(prev => {
      switch (filterKey) {
        case 'search':
          return { ...prev, search: '' };
        case 'category':
          return { ...prev, category: 'All' };
        case 'tags':
          if (value) {
            return { ...prev, tags: prev.tags.filter(t => t !== value) };
          }
          return { ...prev, tags: [] };
        case 'sort':
          return { ...prev, sort: effectiveDefaultSort };
        case 'rarity':
          return { ...prev, rarity: 'All' };
        case 'status':
          return { ...prev, status: 'All' };
        case 'type':
          return { ...prev, type: 'All' };
        case 'dateRange':
          return { ...prev, dateRange: null };
        case 'statRanges':
          if (value) {
            const { [value]: _, ...rest } = prev.statRanges;
            return { ...prev, statRanges: rest };
          }
          return { ...prev, statRanges: {} };
        case 'booleanFilters':
          if (value) {
            const { [value]: _, ...rest } = prev.booleanFilters;
            return { ...prev, booleanFilters: rest };
          }
          return { ...prev, booleanFilters: {} };
        default:
          return prev;
      }
    });
  }, [effectiveDefaultSort]);


  // ============ Filtering Logic ============

  const filteredData = useMemo(() => {
    const filters: FilterFn<T>[] = [];

    // Search filter
    if (searchFields.length > 0 || customSearchFn) {
      const searchFilter = createSearchFilter(
        searchFields as ((item: T) => string)[],
        customSearchFn
      );
      filters.push(searchFilter(state.search));
    }

    // Category filter
    if (categoryField && state.category !== 'All') {
      filters.push(createFieldFilter(categoryField as keyof T, state.category));
    }

    // Tag filter
    if (tagField && state.tags.length > 0) {
      filters.push(createTagFilter(
        tagField as ((item: T) => string[]),
        state.tags
      ));
    }

    // Rarity filter
    if (rarityField && state.rarity !== 'All') {
      filters.push(createFieldFilter(rarityField as keyof T, state.rarity));
    }

    // Status filter
    if (statusField && state.status !== 'All') {
      filters.push(createFieldFilter(statusField as keyof T, state.status));
    }

    // Type filter
    if (typeField && state.type !== 'All') {
      filters.push(createFieldFilter(typeField as keyof T, state.type));
    }

    // Date range filter
    if (dateField && state.dateRange) {
      const field = typeof dateField === 'object' ? dateField.start : dateField;
      filters.push(createDateRangeFilter(
        field as keyof T,
        state.dateRange
      ));
    }

    // Stat range filters
    for (const [key, range] of Object.entries(state.statRanges)) {
      // Find the corresponding range filter config to get the field
      const rangeConfig = config.rangeFilters.find(rf => rf.key === key);
      if (rangeConfig) {
        filters.push(createRangeFilter(
          key as keyof T,
          range
        ));
      }
    }

    // Boolean filters
    for (const [key, value] of Object.entries(state.booleanFilters)) {
      if (value) {
        filters.push(createBooleanFilter(key as keyof T, value));
      }
    }

    // Custom filter function
    if (customFilterFn) {
      filters.push((item: T) => customFilterFn(item, state));
    }

    // Apply all filters
    const composedFilter = composeFilters(filters);
    let result = data.filter(composedFilter);

    // Apply sorting
    const sortConfig: SortConfig<T> = {
      dateField: dateField 
        ? (typeof dateField === 'object' ? dateField.start : dateField) as keyof T
        : 'createdAt' as keyof T,
      nameField: (searchFields[0] as keyof T) ?? 'name' as keyof T,
    };

    const sortFn = createSortFunction(state.sort, sortConfig, customSortFunctions);
    result = [...result].sort(sortFn);

    return result;
  }, [
    data,
    state,
    searchFields,
    categoryField,
    tagField,
    rarityField,
    statusField,
    typeField,
    dateField,
    config.rangeFilters,
    customSearchFn,
    customFilterFn,
    customSortFunctions,
  ]);


  // ============ Computed Values ============

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Search
    if (state.search && state.search.trim() !== '') {
      count++;
    }

    // Category
    if (state.category && state.category !== 'All') {
      count++;
    }

    // Tags
    if (state.tags && state.tags.length > 0) {
      count += state.tags.length;
    }

    // Sort (only count if different from default)
    if (state.sort && state.sort !== effectiveDefaultSort) {
      count++;
    }

    // Rarity
    if (state.rarity && state.rarity !== 'All') {
      count++;
    }

    // Status
    if (state.status && state.status !== 'All') {
      count++;
    }

    // Type
    if (state.type && state.type !== 'All') {
      count++;
    }

    // Date range
    if (state.dateRange && (state.dateRange.start || state.dateRange.end)) {
      count++;
    }

    // Stat ranges
    count += Object.keys(state.statRanges).length;

    // Boolean filters (only count true values)
    count += Object.values(state.booleanFilters).filter(Boolean).length;

    return count;
  }, [state, effectiveDefaultSort]);

  const hasActiveFilters = activeFilterCount > 0;

  // ============ Handlers Object ============

  const handlers: FilterHandlers = useMemo(() => ({
    setSearch,
    setCategory,
    setTags,
    toggleTag,
    setSort,
    setRarity,
    setStatus,
    setType,
    setDateRange,
    setStatRange,
    setBooleanFilter,
    clearFilters,
    clearFilter,
  }), [
    setSearch,
    setCategory,
    setTags,
    toggleTag,
    setSort,
    setRarity,
    setStatus,
    setType,
    setDateRange,
    setStatRange,
    setBooleanFilter,
    clearFilters,
    clearFilter,
  ]);

  return {
    state,
    handlers,
    filteredData,
    activeFilterCount,
    hasActiveFilters,
    config,
  };
}

export default useUnifiedFilter;
