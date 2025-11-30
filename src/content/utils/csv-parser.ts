/**
 * CSV Parser Utility
 * PapaParse-based implementation for parsing and serializing CSV data
 */

import Papa from 'papaparse';

export interface ParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
}

export interface ParseResult<T> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

// Re-export Papa.ParseError for convenience
export type ParseError = Papa.ParseError;

/**
 * Parse CSV content into an array of objects using PapaParse
 * @param csvContent - The raw CSV string to parse
 * @param options - Optional parsing configuration
 * @returns ParseResult containing data, errors, and metadata
 */
export function parseCSV<T = Record<string, string>>(
  csvContent: string,
  options?: ParseOptions
): ParseResult<T> {
  const result = Papa.parse<T>(csvContent, {
    header: true,
    skipEmptyLines: options?.skipEmptyLines ?? true,
    transformHeader: (header) => header.trim(),
    transform: (value) => options?.trimValues !== false ? value.trim() : value,
    delimiter: options?.delimiter ?? ',',
  });

  return {
    data: result.data,
    errors: result.errors,
    meta: result.meta,
  };
}

/**
 * Serialize an array of objects to CSV format using PapaParse
 * @param data - Array of objects to serialize
 * @param options - Optional serialization configuration
 * @returns CSV string with headers
 */
export function serializeCSV<T extends Record<string, unknown>>(
  data: T[],
  options?: { columns?: string[] }
): string {
  return Papa.unparse(data, {
    columns: options?.columns,
    header: true,
  });
}

// ============================================================================
// Utility functions for type conversion
// ============================================================================

/**
 * Parse a string value into an array
 * Supports both JSON array format and pipe-separated format
 */
export function parseArray(value: string): string[] {
  if (!value || value.trim() === '') return [];
  // Support both JSON array format and pipe-separated format
  if (value.trim().startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value.split('|').map(v => v.trim()).filter(Boolean);
}

/**
 * Parse a JSON string into a typed object
 */
export function parseJSON<T>(value: string): T | null {
  if (!value || value.trim() === '') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Parse a string value into a boolean
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Parse a string value into a number
 */
export function parseNumber(value: string): number | null {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse a string value into a Date
 */
export function parseDate(value: string): Date | null {
  if (!value || value.trim() === '') return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a string looks like an ISO 8601 date format
 * Matches formats like: 2024-01-15, 2024-01-15T10:30:00, 2024-01-15T10:30:00.000Z
 */
export function looksLikeISODate(value: string): boolean {
  // Match ISO 8601 date formats
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value);
}


