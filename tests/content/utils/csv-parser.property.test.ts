/**
 * Property-Based Tests for CSV Parser
 * 
 * **Feature: utils-optimization, Property 4: CSV Parsing Equivalence**
 * **Validates: Requirements 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseCSV } from '../../../src/content/utils/csv-parser';
import { parseCSVChunked } from '../../../src/content/utils/performance';

/**
 * Generate a valid CSV cell value that doesn't break CSV parsing
 * Uses alphanumeric characters to avoid parsing inconsistencies
 */
const csvCellArbitrary = fc.stringMatching(/^[a-zA-Z0-9 _.-]{0,20}$/);

/**
 * Generate a valid CSV header name (alphanumeric, no special chars)
 */
const csvHeaderArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,9}$/);

/**
 * Generate a CSV row as an array of cell values
 */
const csvRowArbitrary = (columnCount: number) =>
  fc.array(csvCellArbitrary, { minLength: columnCount, maxLength: columnCount });

/**
 * Generate valid CSV content with headers and rows
 */
const csvContentArbitrary = fc
  .integer({ min: 1, max: 5 }) // number of columns
  .chain((columnCount) =>
    fc.tuple(
      // Generate unique headers
      fc.array(csvHeaderArbitrary, { minLength: columnCount, maxLength: columnCount })
        .map(headers => {
          // Ensure headers are unique by appending index if needed
          const seen = new Set<string>();
          return headers.map((h, i) => {
            let header = h || `col${i}`;
            while (seen.has(header)) {
              header = `${header}${i}`;
            }
            seen.add(header);
            return header;
          });
        }),
      // Generate rows
      fc.array(csvRowArbitrary(columnCount), { minLength: 1, maxLength: 10 })
    )
  )
  .map(([headers, rows]) => {
    // Build CSV string
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => row.join(','));
    return [headerLine, ...dataLines].join('\n');
  });

describe('CSV Parser Property Tests', () => {
  /**
   * **Feature: utils-optimization, Property 4: CSV Parsing Equivalence**
   * **Validates: Requirements 2.4**
   * 
   * *For any* valid CSV content, parsing with `parseCSV` and `parseCSVChunked` 
   * SHALL produce equivalent data arrays.
   */
  it('Property 4: parseCSV and parseCSVChunked produce equivalent results', async () => {
    await fc.assert(
      fc.asyncProperty(csvContentArbitrary, async (csvContent) => {
        // Parse with synchronous parseCSV
        const syncResult = parseCSV<Record<string, string>>(csvContent);
        
        // Parse with async parseCSVChunked
        const asyncResult = await parseCSVChunked<Record<string, string>>(csvContent);
        
        // Both should produce the same number of rows
        expect(asyncResult.data.length).toBe(syncResult.data.length);
        
        // Both should produce equivalent data
        for (let i = 0; i < syncResult.data.length; i++) {
          const syncRow = syncResult.data[i];
          const asyncRow = asyncResult.data[i];
          
          // Check all keys match
          const syncKeys = Object.keys(syncRow).sort();
          const asyncKeys = Object.keys(asyncRow).sort();
          expect(asyncKeys).toEqual(syncKeys);
          
          // Check all values match
          for (const key of syncKeys) {
            expect(asyncRow[key]).toBe(syncRow[key]);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
