/**
 * Filter Functions Module
 * 
 * This module provides composable filter functions for the unified filter system.
 * Each function returns a predicate that can be used to filter data arrays.
 */

/**
 * Type for a filter function that takes an item and returns whether it passes the filter
 */
export type FilterFn<T> = (item: T) => boolean;

/**
 * Type for field accessor - can be a key of T or a function that extracts a value
 */
export type FieldAccessor<T, R> = keyof T | ((item: T) => R);

/**
 * Helper to get a value from an item using a field accessor
 */
function getFieldValue<T, R>(item: T, accessor: FieldAccessor<T, R>): R {
  if (typeof accessor === 'function') {
    return accessor(item);
  }
  return item[accessor] as unknown as R;
}

/**
 * Creates a search filter that matches items against multiple fields
 * 
 * @param fields - Array of field accessors to search in
 * @param customFn - Optional custom search function to use instead
 * @returns A function that takes a search term and returns a filter function
 * 
 * Requirements: 2.1
 */
export function createSearchFilter<T>(
  fields: FieldAccessor<T, string>[],
  customFn?: (item: T, searchTerm: string) => boolean
): (searchTerm: string) => FilterFn<T> {
  return (searchTerm: string): FilterFn<T> => {
    // Empty search matches everything
    if (!searchTerm || searchTerm.trim() === '') {
      return () => true;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Use custom function if provided
    if (customFn) {
      return (item: T) => customFn(item, normalizedSearch);
    }

    // Default: match against any of the specified fields
    return (item: T) => {
      return fields.some((field) => {
        const value = getFieldValue(item, field);
        if (value == null) return false;
        return String(value).toLowerCase().includes(normalizedSearch);
      });
    };
  };
}


/**
 * Creates a field filter for category/rarity/status/type filtering
 * 
 * @param field - The field accessor to filter on
 * @param value - The value to match (or "All" to match everything)
 * @returns A filter function
 * 
 * Requirements: 2.2, 3.4, 3.5
 */
export function createFieldFilter<T>(
  field: FieldAccessor<T, string>,
  value: string
): FilterFn<T> {
  // "All" matches everything
  if (!value || value === 'All') {
    return () => true;
  }

  return (item: T) => {
    const fieldValue = getFieldValue(item, field);
    if (fieldValue == null) return false;
    return String(fieldValue) === value;
  };
}

/**
 * Creates a tag filter that matches items with any of the selected tags
 * 
 * @param field - The field accessor that returns an array of tags
 * @param tags - Array of tags to match against
 * @returns A filter function
 * 
 * Requirements: 2.3
 */
export function createTagFilter<T>(
  field: FieldAccessor<T, string[]>,
  tags: string[]
): FilterFn<T> {
  // Empty tags matches everything
  if (!tags || tags.length === 0) {
    return () => true;
  }

  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  return (item: T) => {
    const itemTags = getFieldValue(item, field);
    if (!Array.isArray(itemTags)) return false;
    
    // Match if item has at least one of the selected tags
    return itemTags.some(tag => tagSet.has(String(tag).toLowerCase()));
  };
}

/**
 * Creates a range filter for numeric values
 * 
 * @param field - The field accessor that returns a numeric value
 * @param range - Tuple of [min, max] values (inclusive)
 * @returns A filter function
 * 
 * Requirements: 4.2
 */
export function createRangeFilter<T>(
  field: FieldAccessor<T, number>,
  range: [number, number]
): FilterFn<T> {
  const [min, max] = range;

  return (item: T) => {
    const value = getFieldValue(item, field);
    if (value == null || typeof value !== 'number') return false;
    return value >= min && value <= max;
  };
}

/**
 * Creates a date range filter
 * 
 * @param field - The field accessor that returns a date string or Date object
 * @param dateRange - Object with start and end date strings (ISO format)
 * @returns A filter function
 * 
 * Requirements: 4.4
 */
export function createDateRangeFilter<T>(
  field: FieldAccessor<T, string | Date>,
  dateRange: { start: string; end: string }
): FilterFn<T> {
  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end) : null;

  // If both dates are invalid, match everything
  if (!startDate && !endDate) {
    return () => true;
  }

  return (item: T) => {
    const value = getFieldValue(item, field);
    if (value == null) return false;

    const itemDate = value instanceof Date ? value : new Date(String(value));
    if (isNaN(itemDate.getTime())) return false;

    // Check start bound
    if (startDate && !isNaN(startDate.getTime()) && itemDate < startDate) {
      return false;
    }

    // Check end bound
    if (endDate && !isNaN(endDate.getTime()) && itemDate > endDate) {
      return false;
    }

    return true;
  };
}

/**
 * Creates a boolean filter
 * 
 * @param field - The field accessor that returns a boolean value
 * @param value - The boolean value to match
 * @returns A filter function
 * 
 * Requirements: 4.5 (implied from boolean filters in design)
 */
export function createBooleanFilter<T>(
  field: FieldAccessor<T, boolean>,
  value: boolean
): FilterFn<T> {
  // If value is false, don't filter (show all)
  if (!value) {
    return () => true;
  }

  return (item: T) => {
    const fieldValue = getFieldValue(item, field);
    return fieldValue === true;
  };
}

/**
 * Composes multiple filter functions into a single filter
 * An item passes if it passes ALL filters (AND logic)
 * 
 * @param filters - Array of filter functions to compose
 * @returns A single filter function that combines all filters
 */
export function composeFilters<T>(filters: FilterFn<T>[]): FilterFn<T> {
  // No filters means everything passes
  if (!filters || filters.length === 0) {
    return () => true;
  }

  // Single filter, return it directly
  if (filters.length === 1) {
    return filters[0];
  }

  // Multiple filters: item must pass all
  return (item: T) => filters.every(filter => filter(item));
}
