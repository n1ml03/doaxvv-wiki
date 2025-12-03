/**
 * Unified Filter Preset Configurations
 * 
 * This module provides preset configurations for different page types
 * and utilities for merging custom configurations with presets.
 */

import type {
  FilterPreset,
  PresetConfig,
  FilterOption,
  ResolvedFilterConfig,
  RangeFilter,
  BooleanFilter,
  DateRangeFilter,
} from './types';

// ============ Translation Function Type ============

type TranslationFn = (key: string) => string;

// ============ Default Sort Options ============

/**
 * Returns the default sort options available for all presets
 */
export const getDefaultSortOptions = (t: TranslationFn): FilterOption[] => [
  { value: 'newest', label: t('sort.newest') },
  { value: 'oldest', label: t('sort.oldest') },
  { value: 'a-z', label: t('sort.az') },
  { value: 'z-a', label: t('sort.za') },
  { value: 'popular', label: t('sort.popular') },
];

// ============ Preset Configurations ============

/**
 * Returns the configuration for a specific preset
 * @param preset - The preset type to get configuration for
 * @param t - Translation function for labels
 * @returns The preset configuration
 */
export const getPresetConfig = (preset: FilterPreset, t: TranslationFn): PresetConfig => {
  const configs: Record<FilterPreset, PresetConfig> = {
    characters: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
        { value: 'popular', label: t('sort.popular') },
        { value: 'pow-high', label: 'POW ↓' },
        { value: 'tec-high', label: 'TEC ↓' },
        { value: 'stm-high', label: 'STM ↓' },
      ],
      rangeFilters: [
        { key: 'pow', label: 'POW', min: 0, max: 100, step: 5 },
        { key: 'tec', label: 'TEC', min: 0, max: 100, step: 5 },
        { key: 'stm', label: 'STM', min: 0, max: 100, step: 5 },
      ],
    },

    swimsuits: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
        { value: 'rarity-high', label: t('filter.rarityHigh') },
        { value: 'pow-high', label: 'POW ↓' },
        { value: 'tec-high', label: 'TEC ↓' },
        { value: 'stm-high', label: 'STM ↓' },
      ],
      rarities: [
        { value: 'SSR', label: t('rarity.ssr') },
        { value: 'SR', label: t('rarity.sr') },
        { value: 'R', label: t('rarity.r') },
      ],
      rangeFilters: [
        { key: 'pow', label: 'POW', min: 0, max: 5000, step: 100 },
        { key: 'tec', label: 'TEC', min: 0, max: 5000, step: 100 },
        { key: 'stm', label: 'STM', min: 0, max: 5000, step: 100 },
      ],
    },

    events: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'ending-soon', label: t('filter.endingSoon') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
      ],
      statuses: [
        { value: 'Active', label: t('status.active') },
        { value: 'Upcoming', label: t('status.upcoming') },
        { value: 'Ended', label: t('status.ended') },
      ],
      types: [
        { value: 'Main', label: t('eventType.main') },
        { value: 'Daily', label: t('eventType.daily') },
        { value: 'Event', label: t('eventType.event') },
      ],
      dateRangeFilter: { key: 'eventDate', label: t('filter.dateRange') },
    },

    festivals: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'ending-soon', label: t('filter.endingSoon') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
      ],
      statuses: [
        { value: 'Active', label: t('status.active') },
        { value: 'Upcoming', label: t('status.upcoming') },
        { value: 'Ended', label: t('status.ended') },
      ],
      dateRangeFilter: { key: 'festivalDate', label: t('filter.dateRange') },
    },

    gachas: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'ending-soon', label: t('filter.endingSoon') },
        { value: 'rate-high', label: t('filter.rateHigh') },
        { value: 'a-z', label: t('sort.az') },
      ],
      statuses: [
        { value: 'Active', label: t('status.active') },
        { value: 'Coming Soon', label: t('status.comingSoon') },
        { value: 'Ended', label: t('status.ended') },
      ],
      booleanFilters: [
        { key: 'stepUp', label: t('filter.stepUpOnly') },
      ],
      rangeFilters: [
        { key: 'ssrRate', label: t('filter.ssrRate'), min: 0, max: 10, step: 0.5 },
      ],
    },

    items: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
      ],
      types: [
        { value: 'Decoration', label: t('itemType.decoration') },
        { value: 'Consumable', label: t('itemType.consumable') },
        { value: 'Material', label: t('itemType.material') },
      ],
    },

    guides: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
        { value: 'difficulty-asc', label: t('filter.difficultyAsc') },
        { value: 'difficulty-desc', label: t('filter.difficultyDesc') },
      ],
      types: [
        { value: 'Easy', label: t('difficulty.easy') },
        { value: 'Medium', label: t('difficulty.medium') },
        { value: 'Hard', label: t('difficulty.hard') },
      ],
    },

    episodes: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
      ],
      statuses: [
        { value: 'Available', label: t('status.available') },
        { value: 'Coming Soon', label: t('status.comingSoon') },
        { value: 'Limited', label: t('status.limited') },
      ],
      types: [
        { value: 'Character', label: t('filters.character') },
        { value: 'Gravure', label: t('filters.gravure') },
        { value: 'Event', label: t('filters.event') },
        { value: 'Extra', label: t('filters.extra') },
        { value: 'Bromide', label: t('filters.bromide') },
      ],
    },

    accessories: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
        { value: 'rarity-high', label: t('filter.rarityHigh') },
      ],
      rarities: [
        { value: 'SSR', label: t('rarity.ssr') },
        { value: 'SR', label: t('rarity.sr') },
        { value: 'R', label: t('rarity.r') },
        { value: 'N', label: t('rarity.n') },
      ],
      types: [
        { value: 'Event', label: t('obtainMethod.event') },
        { value: 'Gacha', label: t('obtainMethod.gacha') },
        { value: 'Shop', label: t('obtainMethod.shop') },
        { value: 'Quest', label: t('obtainMethod.quest') },
        { value: 'Login', label: t('obtainMethod.login') },
      ],
    },

    missions: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'z-a', label: t('sort.za') },
      ],
      types: [
        { value: 'Daily', label: t('missionType.daily') },
        { value: 'Weekly', label: t('missionType.weekly') },
        { value: 'Event', label: t('missionType.event') },
      ],
    },

    quizzes: {
      sortOptions: [
        { value: 'newest', label: t('sort.newest') },
        { value: 'a-z', label: t('sort.az') },
        { value: 'difficulty-asc', label: t('quiz.sortDifficultyAsc') },
        { value: 'difficulty-desc', label: t('quiz.sortDifficultyDesc') },
      ],
      types: [
        { value: 'Easy', label: t('difficulty.easy') },
        { value: 'Medium', label: t('difficulty.medium') },
        { value: 'Hard', label: t('difficulty.hard') },
      ],
    },

    default: {
      sortOptions: getDefaultSortOptions(t),
    },
  };

  return configs[preset] || configs.default;
};

// ============ Configuration Merging ============

/**
 * Custom configuration options that can override preset defaults
 */
export interface CustomFilterConfig {
  sortOptions?: FilterOption[];
  rarities?: FilterOption[];
  statuses?: FilterOption[];
  types?: FilterOption[];
  rangeFilters?: RangeFilter[];
  booleanFilters?: BooleanFilter[];
  dateRangeFilter?: DateRangeFilter;
  defaultSort?: string;
}

/**
 * Merges a preset configuration with custom overrides to produce a resolved configuration.
 * Custom options override preset defaults for matching keys.
 * 
 * @param presetConfig - The base preset configuration
 * @param customConfig - Custom configuration to merge (optional)
 * @returns The fully resolved filter configuration
 */
export const mergeConfigs = (
  presetConfig: PresetConfig,
  customConfig?: CustomFilterConfig
): ResolvedFilterConfig => {
  // Start with preset values, use custom values if provided
  const sortOptions = customConfig?.sortOptions ?? presetConfig.sortOptions;
  const rarities = customConfig?.rarities ?? presetConfig.rarities ?? [];
  const statuses = customConfig?.statuses ?? presetConfig.statuses ?? [];
  const types = customConfig?.types ?? presetConfig.types ?? [];
  const rangeFilters = customConfig?.rangeFilters ?? presetConfig.rangeFilters ?? [];
  const booleanFilters = customConfig?.booleanFilters ?? presetConfig.booleanFilters ?? [];
  const dateRangeFilter = customConfig?.dateRangeFilter ?? presetConfig.dateRangeFilter ?? null;

  // Determine if there are advanced filters
  const hasAdvancedFilters = 
    rangeFilters.length > 0 || 
    booleanFilters.length > 0 || 
    dateRangeFilter !== null;

  return {
    sortOptions,
    rarities,
    statuses,
    types,
    rangeFilters,
    booleanFilters,
    dateRangeFilter,
    hasAdvancedFilters,
  };
};

/**
 * Convenience function to get a fully resolved configuration for a preset
 * with optional custom overrides.
 * 
 * @param preset - The preset type
 * @param t - Translation function
 * @param customConfig - Optional custom configuration to merge
 * @returns The fully resolved filter configuration
 */
export const getResolvedConfig = (
  preset: FilterPreset,
  t: TranslationFn,
  customConfig?: CustomFilterConfig
): ResolvedFilterConfig => {
  const presetConfig = getPresetConfig(preset, t);
  return mergeConfigs(presetConfig, customConfig);
};
