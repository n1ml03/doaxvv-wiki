/**
 * Sort Functions Module
 * 
 * This module provides composable sort functions for the unified filter system.
 * Each function returns a comparator that can be used with Array.sort().
 * 
 * Requirements: 2.4, 5.3
 */

/**
 * Type for a sort comparator function
 */
export type SortFn<T> = (a: T, b: T) => number;

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
 * Default sort keys supported by the system
 */
export type DefaultSortKey = 
  | 'newest' 
  | 'oldest' 
  | 'a-z' 
  | 'z-a' 
  | 'popular';

/**
 * Configuration for creating sort functions
 */
export interface SortConfig<T> {
  /** Field to use for date-based sorting (newest/oldest) */
  dateField?: FieldAccessor<T, string | Date | number>;
  /** Field to use for name-based sorting (a-z/z-a) */
  nameField?: FieldAccessor<T, string>;
  /** Field to use for popularity sorting */
  popularityField?: FieldAccessor<T, number>;
}

/**
 * Creates a sort function based on the sort key
 * 
 * @param sortKey - The key identifying which sort to apply
 * @param config - Configuration for field mappings
 * @param customFns - Optional custom sort functions to use instead of defaults
 * @returns A sort comparator function
 * 
 * Requirements: 2.4, 5.3
 */
export function createSortFunction<T>(
  sortKey: string,
  config?: SortConfig<T>,
  customFns?: Record<string, SortFn<T>>
): SortFn<T> {
  // Check for custom sort function first
  if (customFns && customFns[sortKey]) {
    return customFns[sortKey];
  }

  // Default field accessors
  const dateField = config?.dateField ?? ('createdAt' as keyof T);
  const nameField = config?.nameField ?? ('name' as keyof T);
  const popularityField = config?.popularityField ?? ('popularity' as keyof T);

  switch (sortKey) {
    case 'newest':
      return createDateSort(dateField, 'desc');
    
    case 'oldest':
      return createDateSort(dateField, 'asc');
    
    case 'a-z':
      return createAlphaSort(nameField, 'asc');
    
    case 'z-a':
      return createAlphaSort(nameField, 'desc');
    
    case 'popular':
      return createNumericSort(popularityField, 'desc');
    
    default:
      // For unknown sort keys, return a no-op sort (maintains original order)
      return () => 0;
  }
}

/**
 * Creates a date-based sort comparator
 * 
 * @param field - The field accessor for the date value
 * @param direction - 'asc' for oldest first, 'desc' for newest first
 * @returns A sort comparator function
 */
export function createDateSort<T>(
  field: FieldAccessor<T, string | Date | number>,
  direction: 'asc' | 'desc' = 'desc'
): SortFn<T> {
  return (a: T, b: T): number => {
    const aValue = getFieldValue(a, field);
    const bValue = getFieldValue(b, field);

    const aDate = toTimestamp(aValue);
    const bDate = toTimestamp(bValue);

    // Handle null/invalid dates - push them to the end
    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;

    const diff = aDate - bDate;
    return direction === 'desc' ? -diff : diff;
  };
}

/**
 * Creates an alphabetical sort comparator
 * 
 * @param field - The field accessor for the string value
 * @param direction - 'asc' for A-Z, 'desc' for Z-A
 * @returns A sort comparator function
 */
export function createAlphaSort<T>(
  field: FieldAccessor<T, string>,
  direction: 'asc' | 'desc' = 'asc'
): SortFn<T> {
  return (a: T, b: T): number => {
    const aValue = getFieldValue(a, field);
    const bValue = getFieldValue(b, field);

    const aStr = normalizeString(aValue);
    const bStr = normalizeString(bValue);

    // Handle empty strings - push them to the end
    if (!aStr && !bStr) return 0;
    if (!aStr) return 1;
    if (!bStr) return -1;

    const comparison = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
    return direction === 'desc' ? -comparison : comparison;
  };
}

/**
 * Creates a numeric sort comparator
 * 
 * @param field - The field accessor for the numeric value
 * @param direction - 'asc' for lowest first, 'desc' for highest first
 * @returns A sort comparator function
 */
export function createNumericSort<T>(
  field: FieldAccessor<T, number>,
  direction: 'asc' | 'desc' = 'desc'
): SortFn<T> {
  return (a: T, b: T): number => {
    const aValue = getFieldValue(a, field);
    const bValue = getFieldValue(b, field);

    const aNum = toNumber(aValue);
    const bNum = toNumber(bValue);

    // Handle null/NaN values - push them to the end
    if (aNum === null && bNum === null) return 0;
    if (aNum === null) return 1;
    if (bNum === null) return -1;

    const diff = aNum - bNum;
    return direction === 'desc' ? -diff : diff;
  };
}

/**
 * Composes multiple sort functions into a single sort
 * Items are sorted by the first function, then ties are broken by subsequent functions
 * 
 * @param sortFns - Array of sort functions to compose
 * @returns A single sort function that applies all sorts in order
 */
export function composeSorts<T>(sortFns: SortFn<T>[]): SortFn<T> {
  if (!sortFns || sortFns.length === 0) {
    return () => 0;
  }

  if (sortFns.length === 1) {
    return sortFns[0];
  }

  return (a: T, b: T): number => {
    for (const sortFn of sortFns) {
      const result = sortFn(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}

// ============ Helper Functions ============

/**
 * Converts a value to a timestamp for comparison
 */
function toTimestamp(value: unknown): number | null {
  if (value == null) return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (value instanceof Date) {
    const time = value.getTime();
    return isNaN(time) ? null : time;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    const time = date.getTime();
    return isNaN(time) ? null : time;
  }
  
  return null;
}

/**
 * Normalizes a string value for comparison
 */
function normalizeString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

/**
 * Converts a value to a number for comparison
 */
function toNumber(value: unknown): number | null {
  if (value == null) return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  const num = Number(value);
  return isNaN(num) ? null : num;
}
