/**
 * Quiz CSV Parser Utility
 * Handles parsing and serialization of quiz data from/to CSV format
 * Supports localized fields and validates required data
 */

import type { Quiz, QuizDifficulty, QuizStatus } from '@/features/quiz/types';
import type { LocalizedString, LanguageCode } from '@/shared/types/localization';
import { SUPPORTED_LANGUAGES } from '@/shared/types/localization';
import { parseCSV, parseArray, parseNumber } from './csv-parser';

/**
 * Raw quiz row from CSV parsing
 */
interface RawQuizRow {
  id: string;
  unique_key: string;
  name_en: string;
  name_jp: string;
  name_cn?: string;
  name_tw?: string;
  name_kr?: string;
  description_en: string;
  description_jp: string;
  description_cn?: string;
  description_tw?: string;
  description_kr?: string;
  image: string;
  category: string;
  difficulty: string;
  time_limit: string;
  question_count: string;
  questions_ref: string;
  status: string;
  updated_at: string;
  author: string;
  tags: string;
}

/**
 * Validation error for quiz parsing
 */
export interface QuizValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

/**
 * Result of quiz CSV parsing
 */
export interface QuizParseResult {
  quizzes: Quiz[];
  errors: QuizValidationError[];
}

/**
 * Valid difficulty values
 */
const VALID_DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];

/**
 * Valid status values
 */
const VALID_STATUSES: QuizStatus[] = ['draft', 'published', 'archived'];

/**
 * Parse localized string fields from raw CSV row
 */
function parseLocalizedString(
  row: RawQuizRow,
  fieldPrefix: string
): LocalizedString {
  const getValue = (lang: LanguageCode): string => {
    const key = `${fieldPrefix}_${lang}` as keyof RawQuizRow;
    return (row[key] as string) || '';
  };

  return {
    en: getValue('en'),
    jp: getValue('jp'),
    cn: getValue('cn') || undefined,
    tw: getValue('tw') || undefined,
    kr: getValue('kr') || undefined,
  };
}

/**
 * Validate a single quiz row and return errors
 */
function validateQuizRow(row: RawQuizRow, rowIndex: number): QuizValidationError[] {
  const errors: QuizValidationError[] = [];

  // Required fields validation
  if (!row.id || row.id.trim() === '') {
    errors.push({ row: rowIndex, field: 'id', message: 'id is required' });
  } else {
    const id = parseNumber(row.id);
    if (id === null || !Number.isInteger(id) || id < 0) {
      errors.push({ row: rowIndex, field: 'id', message: 'id must be a valid positive integer', value: row.id });
    }
  }

  if (!row.unique_key || row.unique_key.trim() === '') {
    errors.push({ row: rowIndex, field: 'unique_key', message: 'unique_key is required' });
  }

  if (!row.name_en || row.name_en.trim() === '') {
    errors.push({ row: rowIndex, field: 'name', message: 'name (at least name_en) is required' });
  }

  if (!row.difficulty || row.difficulty.trim() === '') {
    errors.push({ row: rowIndex, field: 'difficulty', message: 'difficulty is required' });
  } else if (!VALID_DIFFICULTIES.includes(row.difficulty as QuizDifficulty)) {
    errors.push({ 
      row: rowIndex, 
      field: 'difficulty', 
      message: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      value: row.difficulty 
    });
  }

  if (!row.questions_ref || row.questions_ref.trim() === '') {
    errors.push({ row: rowIndex, field: 'questions_ref', message: 'questions_ref is required' });
  }

  // Optional field validation
  if (row.status && !VALID_STATUSES.includes(row.status as QuizStatus)) {
    errors.push({ 
      row: rowIndex, 
      field: 'status', 
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      value: row.status 
    });
  }

  if (row.time_limit) {
    const timeLimit = parseNumber(row.time_limit);
    if (timeLimit === null || timeLimit < 0) {
      errors.push({ 
        row: rowIndex, 
        field: 'time_limit', 
        message: 'time_limit must be a non-negative number',
        value: row.time_limit 
      });
    }
  }

  if (row.question_count) {
    const questionCount = parseNumber(row.question_count);
    if (questionCount === null || !Number.isInteger(questionCount) || questionCount < 0) {
      errors.push({ 
        row: rowIndex, 
        field: 'question_count', 
        message: 'question_count must be a non-negative integer',
        value: row.question_count 
      });
    }
  }

  return errors;
}

/**
 * Convert a validated raw row to a Quiz object
 */
function rowToQuiz(row: RawQuizRow): Quiz {
  return {
    id: parseNumber(row.id) ?? 0,
    unique_key: row.unique_key.trim(),
    name: parseLocalizedString(row, 'name'),
    description: parseLocalizedString(row, 'description'),
    image: row.image?.trim() || '',
    category: row.category?.trim() || '',
    difficulty: (row.difficulty?.trim() as QuizDifficulty) || 'Easy',
    time_limit: parseNumber(row.time_limit) ?? 0,
    question_count: parseNumber(row.question_count) ?? 0,
    questions_ref: row.questions_ref.trim(),
    status: (row.status?.trim() as QuizStatus) || 'draft',
    updated_at: row.updated_at?.trim() || '',
    author: row.author?.trim() || '',
    tags: parseArray(row.tags || ''),
  };
}

/**
 * Parse quiz CSV content into Quiz objects
 * @param csvContent - Raw CSV string to parse
 * @returns QuizParseResult with quizzes and any validation errors
 */
export function parseQuizCSV(csvContent: string): QuizParseResult {
  const result = parseCSV<RawQuizRow>(csvContent);
  const quizzes: Quiz[] = [];
  const errors: QuizValidationError[] = [];

  // Add any CSV parsing errors
  for (const error of result.errors) {
    errors.push({
      row: error.row ?? 0,
      field: 'csv',
      message: error.message,
    });
  }

  // Validate and convert each row
  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowErrors = validateQuizRow(row, i + 1); // 1-indexed for user-friendly messages

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      quizzes.push(rowToQuiz(row));
    }
  }

  return { quizzes, errors };
}

/**
 * Serialize Quiz objects back to CSV format
 * @param quizzes - Array of Quiz objects to serialize
 * @returns CSV string with headers
 */
export function serializeQuizCSV(quizzes: Quiz[]): string {
  if (quizzes.length === 0) {
    return '';
  }

  // Build headers
  const headers: string[] = [
    'id',
    'unique_key',
    ...SUPPORTED_LANGUAGES.map(lang => `name_${lang}`),
    ...SUPPORTED_LANGUAGES.map(lang => `description_${lang}`),
    'image',
    'category',
    'difficulty',
    'time_limit',
    'question_count',
    'questions_ref',
    'status',
    'updated_at',
    'author',
    'tags',
  ];

  const lines: string[] = [headers.join(',')];

  // Serialize each quiz
  for (const quiz of quizzes) {
    const values: string[] = [
      String(quiz.id),
      escapeCSVValue(quiz.unique_key),
      ...SUPPORTED_LANGUAGES.map(lang => escapeCSVValue(quiz.name[lang] || '')),
      ...SUPPORTED_LANGUAGES.map(lang => escapeCSVValue(quiz.description[lang] || '')),
      escapeCSVValue(quiz.image),
      escapeCSVValue(quiz.category),
      quiz.difficulty,
      String(quiz.time_limit),
      String(quiz.question_count),
      escapeCSVValue(quiz.questions_ref),
      quiz.status,
      escapeCSVValue(quiz.updated_at),
      escapeCSVValue(quiz.author),
      quiz.tags.join('|'),
    ];
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Check if quiz parse result has any errors
 */
export function hasQuizParseErrors(result: QuizParseResult): boolean {
  return result.errors.length > 0;
}

/**
 * Get only valid quizzes from parse result (ignoring errors)
 */
export function getValidQuizzes(result: QuizParseResult): Quiz[] {
  return result.quizzes;
}
