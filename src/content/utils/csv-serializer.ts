/**
 * CSV Serializer Utility
 * Handles serialization and deserialization of content objects to/from CSV format
 * Supports round-trip conversion for LocalizedString fields, arrays, JSON objects, and dates
 */

import type { LocalizedString, LanguageCode } from '../../shared/types/localization';
import { SUPPORTED_LANGUAGES } from '../../shared/types/localization';
import { parseArray, parseJSON, parseDate, parseBoolean, parseNumber, looksLikeISODate } from './csv-parser';

export interface SerializeOptions {
  delimiter?: string;
  includeHeader?: boolean;
  localizedFields?: string[];
  arrayFields?: string[];
  jsonFields?: string[];
  dateFields?: string[];
}

export interface DeserializeOptions {
  delimiter?: string;
  localizedFields?: string[];
  arrayFields?: string[];
  jsonFields?: string[];
  dateFields?: string[];
}

/**
 * CSVSerializer class for converting objects to CSV strings and back
 * Handles special field types: LocalizedString, arrays, JSON objects, and dates
 */
export class CSVSerializer {
  private serializeOptions: Required<SerializeOptions>;
  private deserializeOptions: Required<DeserializeOptions>;

  constructor(
    serializeOptions: SerializeOptions = {},
    deserializeOptions: DeserializeOptions = {}
  ) {
    this.serializeOptions = {
      delimiter: serializeOptions.delimiter || ',',
      includeHeader: serializeOptions.includeHeader !== false,
      localizedFields: serializeOptions.localizedFields || [],
      arrayFields: serializeOptions.arrayFields || [],
      jsonFields: serializeOptions.jsonFields || [],
      dateFields: serializeOptions.dateFields || [],
    };

    this.deserializeOptions = {
      delimiter: deserializeOptions.delimiter || ',',
      localizedFields: deserializeOptions.localizedFields || [],
      arrayFields: deserializeOptions.arrayFields || [],
      jsonFields: deserializeOptions.jsonFields || [],
      dateFields: deserializeOptions.dateFields || [],
    };
  }

  /**
   * Serialize an array of objects to CSV string
   * @param data Array of objects to serialize
   * @returns CSV string representation
   */
  serialize<T extends Record<string, any>>(data: T[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get all unique headers from the data, expanding LocalizedString fields
    const headers = this.getHeaders(data);
    const lines: string[] = [];

    // Add header row
    if (this.serializeOptions.includeHeader) {
      lines.push(headers.join(this.serializeOptions.delimiter));
    }

    // Add data rows
    for (const item of data) {
      const row = this.serializeRow(item, headers);
      lines.push(row);
    }

    return lines.join('\n');
  }

  /**
   * Get all headers from the data, expanding LocalizedString fields
   */
  private getHeaders<T extends Record<string, any>>(data: T[]): string[] {
    const headerSet = new Set<string>();

    for (const item of data) {
      for (const key of Object.keys(item)) {
        const value = item[key];

        // Check if this is a LocalizedString field
        if (this.isLocalizedString(value) || this.serializeOptions.localizedFields.includes(key)) {
          // Expand to language-specific columns
          for (const lang of SUPPORTED_LANGUAGES) {
            headerSet.add(`${key}_${lang}`);
          }
        } else {
          headerSet.add(key);
        }
      }
    }

    return Array.from(headerSet);
  }


  /**
   * Serialize a single row to CSV format
   */
  private serializeRow<T extends Record<string, any>>(item: T, headers: string[]): string {
    const values: string[] = [];

    for (const header of headers) {
      // Check if this is a language-specific column (e.g., name_en, name_jp)
      const langMatch = header.match(/^(.+)_(en|jp|cn|tw|kr)$/);
      
      if (langMatch) {
        const [, fieldName, lang] = langMatch;
        const fieldValue = item[fieldName];
        
        if (this.isLocalizedString(fieldValue)) {
          const localizedValue = fieldValue[lang as LanguageCode];
          values.push(this.escapeValue(localizedValue || ''));
        } else {
          values.push('');
        }
      } else {
        const value = item[header];
        values.push(this.serializeValue(value, header));
      }
    }

    return values.join(this.serializeOptions.delimiter);
  }

  /**
   * Serialize a single value based on its type
   */
  private serializeValue(value: any, _fieldName: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle Date objects
    if (value instanceof Date) {
      return this.escapeValue(value.toISOString());
    }

    // Handle arrays (join with pipe separator)
    if (Array.isArray(value)) {
      // Check if it's an array of objects (like skills)
      if (value.length > 0 && typeof value[0] === 'object') {
        return this.escapeValue(JSON.stringify(value));
      }
      return this.escapeValue(value.join('|'));
    }

    // Handle JSON objects
    if (typeof value === 'object') {
      // Check if it's a LocalizedString
      if (this.isLocalizedString(value)) {
        // This shouldn't happen as LocalizedStrings are expanded to columns
        return this.escapeValue(JSON.stringify(value));
      }
      return this.escapeValue(JSON.stringify(value));
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    // Handle numbers and strings
    return this.escapeValue(String(value));
  }


  /**
   * Escape a value for CSV format
   * Wraps in quotes if contains delimiter, quotes, or newlines
   */
  private escapeValue(value: string): string {
    if (
      value.includes(this.serializeOptions.delimiter) ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    ) {
      // Escape quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }

  /**
   * Check if a value is a LocalizedString object
   */
  private isLocalizedString(value: any): value is LocalizedString {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    // LocalizedString must have 'en' and 'jp' properties
    return typeof value.en === 'string' && typeof value.jp === 'string';
  }

  /**
   * Deserialize a CSV string back to an array of objects
   * @param csvContent CSV string to parse
   * @returns Array of objects
   */
  deserialize<T extends Record<string, any>>(csvContent: string): T[] {
    if (!csvContent || csvContent.trim() === '') {
      return [];
    }

    const lines = csvContent.split('\n');
    if (lines.length === 0) {
      return [];
    }

    // Parse header
    const headers = this.parseLine(lines[0]);
    if (headers.length === 0) {
      return [];
    }

    const data: T[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue;
      }

      const values = this.parseLine(line);
      const row = this.deserializeRow(headers, values);
      data.push(row as T);
    }

    return data;
  }


  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === this.deserializeOptions.delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Deserialize a single row from CSV values
   */
  private deserializeRow(headers: string[], values: string[]): Record<string, any> {
    const row: Record<string, any> = {};
    const localizedFields = new Map<string, Partial<LocalizedString>>();

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = values[i] || '';

      // Check if this is a language-specific column
      const langMatch = header.match(/^(.+)_(en|jp|cn|tw|kr)$/);

      if (langMatch) {
        const [, fieldName, lang] = langMatch;
        
        // Initialize LocalizedString if not exists
        if (!localizedFields.has(fieldName)) {
          localizedFields.set(fieldName, {});
        }
        
        const localizedString = localizedFields.get(fieldName)!;
        if (value) {
          localizedString[lang as LanguageCode] = value;
        }
      } else {
        // Regular field - deserialize based on type
        row[header] = this.deserializeValue(value, header);
      }
    }

    // Add LocalizedString fields to row
    for (const [fieldName, localizedString] of localizedFields) {
      // Only add if at least en and jp are present
      if (localizedString.en !== undefined || localizedString.jp !== undefined) {
        row[fieldName] = {
          en: localizedString.en || '',
          jp: localizedString.jp || '',
          cn: localizedString.cn,
          tw: localizedString.tw,
          kr: localizedString.kr,
        } as LocalizedString;
      }
    }

    return row;
  }


  /**
   * Deserialize a single value based on its content and field configuration
   * Uses shared utilities from csv-parser.ts for type conversion
   */
  private deserializeValue(value: string, fieldName: string): any {
    if (value === '') {
      return '';
    }

    // Check if this is a date field
    if (this.deserializeOptions.dateFields.includes(fieldName)) {
      return parseDate(value);
    }

    // Check if this is a JSON field
    if (this.deserializeOptions.jsonFields.includes(fieldName)) {
      return parseJSON(value);
    }

    // Check if this is an array field (pipe-separated)
    if (this.deserializeOptions.arrayFields.includes(fieldName)) {
      return parseArray(value);
    }

    // Auto-detect types based on content
    // Try to parse as JSON if it looks like JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      const parsed = parseJSON(value);
      if (parsed !== null) {
        return parsed;
      }
    }

    // Try to parse as date if it looks like ISO date
    if (looksLikeISODate(value)) {
      const date = parseDate(value);
      if (date !== null) {
        return date;
      }
    }

    // Check for pipe-separated values
    if (value.includes('|')) {
      return parseArray(value);
    }

    // Check for boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return parseBoolean(value);
    }

    // Check for number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      const num = parseNumber(value);
      return num !== null ? num : value;
    }

    // Return as string
    return value;
  }

}

/**
 * Create a CSVSerializer with common content type configurations
 */
export function createContentSerializer(contentType: string): CSVSerializer {
  const commonDateFields = ['start_date', 'end_date', 'updated_at'];
  const commonArrayFields = ['tags', 'related_ids', 'topics', 'rewards', 'how_to_participate', 'tips', 'featured_swimsuits', 'featured_characters'];
  const commonJsonFields = ['stats', 'rates'];

  const localizedFieldsByType: Record<string, string[]> = {
    character: ['name', 'age', 'birthday', 'height', 'measurements', 'blood_type', 'job', 'hobby', 'food', 'color', 'cast'],
    swimsuit: ['name'],
    event: ['name', 'description'],
    guide: ['localizedTitle', 'content', 'title', 'summary'],
    item: ['name', 'description'],
    gacha: ['name'],
  };

  return new CSVSerializer(
    {
      localizedFields: localizedFieldsByType[contentType] || [],
      arrayFields: commonArrayFields,
      jsonFields: commonJsonFields,
      dateFields: commonDateFields,
    },
    {
      localizedFields: localizedFieldsByType[contentType] || [],
      arrayFields: commonArrayFields,
      jsonFields: commonJsonFields,
      dateFields: commonDateFields,
    }
  );
}
