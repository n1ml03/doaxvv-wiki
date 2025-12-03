/**
 * Content Validator
 * Validates content against schema definitions and business rules
 */

import { REQUIRED_FIELDS, VALID_STATUSES, VALID_RARITIES, VALID_EVENT_TYPES, VALID_EVENT_STATUSES, VALID_GACHA_STATUSES, VALID_QUIZ_DIFFICULTIES } from '../schemas/content.schema';

/**
 * Validation error with field-level details
 */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class ContentValidator {
  validateContent(
    data: Record<string, any>[],
    contentType: keyof typeof REQUIRED_FIELDS,
    rowOffset: number = 2 // Account for header row
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const requiredFields = [
      ...(contentType !== 'category' && contentType !== 'tag' && contentType !== 'gacha' ? REQUIRED_FIELDS.base : []),
      ...(REQUIRED_FIELDS[contentType] || [])
    ];

    data.forEach((row, index) => {
      const rowNum = index + rowOffset;

      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push({
            row: rowNum,
            field,
            message: `Required field '${field}' is missing or empty`,
            value: row[field]
          });
        }
      });

      // Validate specific field types
      this.validateFieldTypes(row, contentType, rowNum, errors, warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateFieldTypes(
    row: Record<string, any>,
    contentType: string,
    rowNum: number,
    errors: ValidationError[],
    warnings: string[]
  ): void {
    // Validate status
    if (row.status && !VALID_STATUSES.includes(row.status)) {
      errors.push({
        row: rowNum,
        field: 'status',
        message: `Invalid status '${row.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
        value: row.status
      });
    }

    // Validate rarity (for characters and swimsuits)
    if ((contentType === 'character' || contentType === 'swimsuit') && row.rarity && !VALID_RARITIES.includes(row.rarity)) {
      errors.push({
        row: rowNum,
        field: 'rarity',
        message: `Invalid rarity '${row.rarity}'. Must be one of: ${VALID_RARITIES.join(', ')}`,
        value: row.rarity
      });
    }

    // Validate event type
    if (contentType === 'event' && row.type && !VALID_EVENT_TYPES.includes(row.type)) {
      errors.push({
        row: rowNum,
        field: 'type',
        message: `Invalid event type '${row.type}'. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        value: row.type
      });
    }

    // Validate event status
    if (contentType === 'event' && row.event_status && !VALID_EVENT_STATUSES.includes(row.event_status)) {
      errors.push({
        row: rowNum,
        field: 'event_status',
        message: `Invalid event status '${row.event_status}'. Must be one of: ${VALID_EVENT_STATUSES.join(', ')}`,
        value: row.event_status
      });
    }

    // Validate gacha status
    if (contentType === 'gacha' && row.gacha_status && !VALID_GACHA_STATUSES.includes(row.gacha_status)) {
      errors.push({
        row: rowNum,
        field: 'gacha_status',
        message: `Invalid gacha status '${row.gacha_status}'. Must be one of: ${VALID_GACHA_STATUSES.join(', ')}`,
        value: row.gacha_status
      });
    }

    // Validate quiz difficulty
    if (contentType === 'quiz' && row.difficulty && !VALID_QUIZ_DIFFICULTIES.includes(row.difficulty)) {
      errors.push({
        row: rowNum,
        field: 'difficulty',
        message: `Invalid difficulty '${row.difficulty}'. Must be one of: ${VALID_QUIZ_DIFFICULTIES.join(', ')}`,
        value: row.difficulty
      });
    }

    // Validate date format
    if (row.updated_at) {
      const date = new Date(row.updated_at);
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowNum,
          field: 'updated_at',
          message: `Invalid date format for 'updated_at': ${row.updated_at}`,
          value: row.updated_at
        });
      }
    }

    // Validate slug format (no spaces, lowercase)
    if (row.slug && !/^[a-z0-9-]+$/.test(row.slug)) {
      warnings.push(`Row ${rowNum}: Slug '${row.slug}' should only contain lowercase letters, numbers, and hyphens`);
    }

    // Validate stats format (for characters and swimsuits)
    if ((contentType === 'character' || contentType === 'swimsuit') && row.stats) {
      try {
        const stats = typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats;
        if (!stats.POW || !stats.TEC || !stats.STM) {
          errors.push({
            row: rowNum,
            field: 'stats',
            message: 'Stats must include POW, TEC, and STM values',
            value: row.stats
          });
        }
      } catch {
        errors.push({
          row: rowNum,
          field: 'stats',
          message: 'Invalid stats format. Expected JSON object with POW, TEC, STM',
          value: row.stats
        });
      }
    }
  }

  validateRelatedIds(
    data: Record<string, any>[],
    allIds: Set<string>,
    rowOffset: number = 2
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + rowOffset;
      
      if (row.related_ids) {
        const relatedIds = typeof row.related_ids === 'string' 
          ? row.related_ids.split('|').map((id: string) => id.trim())
          : row.related_ids;

        relatedIds.forEach((relatedId: string) => {
          if (!allIds.has(relatedId)) {
            warnings.push(`Row ${rowNum}: Related ID '${relatedId}' not found in content collection`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateUniqueIds(data: Record<string, any>[], rowOffset: number = 2): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + rowOffset;
      const id = row.id;

      if (seenIds.has(id)) {
        errors.push({
          row: rowNum,
          field: 'id',
          message: `Duplicate ID '${id}' found`,
          value: id
        });
      } else {
        seenIds.add(id);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
