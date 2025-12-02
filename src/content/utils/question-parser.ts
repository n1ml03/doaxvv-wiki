/**
 * Question Markdown Parser Utility
 * Handles parsing and serialization of quiz questions from/to markdown format
 * Supports single_choice, multiple_choice, and text_input question types
 */

import type { Question, QuestionOption, QuestionType } from '@/features/quiz/types';

/**
 * Validation error for question parsing
 */
export interface QuestionValidationError {
  questionIndex: number;
  field: string;
  message: string;
}

/**
 * Result of question markdown parsing
 */
export interface QuestionParseResult {
  questions: Question[];
  errors: QuestionValidationError[];
}

/**
 * Valid question types
 */
const VALID_QUESTION_TYPES: QuestionType[] = ['single_choice', 'multiple_choice', 'text_input'];

/**
 * Parse question metadata from header lines
 */
function parseQuestionMetadata(lines: string[]): {
  type: QuestionType | null;
  points: number;
  timeLimit?: number;
  answer?: string;
} {
  let type: QuestionType | null = null;
  let points = 10; // default points
  let timeLimit: number | undefined;
  let answer: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('type:')) {
      const typeValue = line.split(':')[1]?.trim().toLowerCase();
      if (VALID_QUESTION_TYPES.includes(typeValue as QuestionType)) {
        type = typeValue as QuestionType;
      }
    } else if (trimmed.startsWith('points:')) {
      const pointsValue = parseInt(line.split(':')[1]?.trim(), 10);
      if (!isNaN(pointsValue) && pointsValue > 0) {
        points = pointsValue;
      }
    } else if (trimmed.startsWith('time_limit:')) {
      const timeLimitValue = parseInt(line.split(':')[1]?.trim(), 10);
      if (!isNaN(timeLimitValue) && timeLimitValue > 0) {
        timeLimit = timeLimitValue;
      }
    } else if (trimmed.startsWith('answer:')) {
      answer = line.substring(line.indexOf(':') + 1).trim();
    }
  }

  return { type, points, timeLimit, answer };
}

/**
 * Parse options from markdown checkbox list
 * Format: - [ ] Option text (unchecked) or - [x] Option text (checked/correct)
 */
function parseOptions(lines: string[]): QuestionOption[] {
  const options: QuestionOption[] = [];
  let optionIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match checkbox pattern: - [ ] or - [x]
    const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch) {
      const isCorrect = checkboxMatch[1].toLowerCase() === 'x';
      const text = checkboxMatch[2].trim();
      
      options.push({
        id: `opt_${optionIndex}`,
        text,
        isCorrect,
      });
      optionIndex++;
    }
  }

  return options;
}

/**
 * Parse a single question block from markdown
 */
function parseQuestionBlock(
  block: string,
  questionIndex: number
): { question: Question | null; errors: QuestionValidationError[] } {
  const errors: QuestionValidationError[] = [];
  const lines = block.split('\n');
  
  // Find the question title line (# Question N)
  let titleLineIndex = -1;
  let questionId = `q_${questionIndex}`;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#\s+Question\s+(\d+)/i);
    if (match) {
      titleLineIndex = i;
      questionId = `q_${match[1]}`;
      break;
    }
  }

  if (titleLineIndex === -1) {
    errors.push({
      questionIndex,
      field: 'title',
      message: 'Question must start with "# Question N" header',
    });
    return { question: null, errors };
  }

  // Find metadata section (lines after title until empty line or content)
  const metadataLines: string[] = [];
  let contentStartIndex = titleLineIndex + 1;
  
  for (let i = titleLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('-') || line.startsWith('##')) {
      contentStartIndex = i;
      break;
    }
    if (line.includes(':')) {
      metadataLines.push(lines[i]);
    } else {
      contentStartIndex = i;
      break;
    }
  }

  const metadata = parseQuestionMetadata(metadataLines);

  if (!metadata.type) {
    errors.push({
      questionIndex,
      field: 'type',
      message: `Question type is required. Must be one of: ${VALID_QUESTION_TYPES.join(', ')}`,
    });
    return { question: null, errors };
  }

  // Find content (question text), options, and explanation
  let content = '';
  const optionLines: string[] = [];
  let explanation = '';
  let inExplanation = false;
  let inOptions = false;

  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('## Explanation')) {
      inExplanation = true;
      inOptions = false;
      continue;
    }

    if (inExplanation) {
      explanation += (explanation ? '\n' : '') + line;
    } else if (trimmed.startsWith('- [')) {
      inOptions = true;
      optionLines.push(line);
    } else if (inOptions && trimmed.startsWith('-')) {
      optionLines.push(line);
    } else if (!inOptions && trimmed !== '') {
      content += (content ? '\n' : '') + line;
    }
  }

  content = content.trim();
  explanation = explanation.trim();

  if (!content) {
    errors.push({
      questionIndex,
      field: 'content',
      message: 'Question content is required',
    });
    return { question: null, errors };
  }

  // Parse options for choice questions
  const options = parseOptions(optionLines);

  // Validate based on question type
  if (metadata.type === 'single_choice' || metadata.type === 'multiple_choice') {
    if (options.length < 2) {
      errors.push({
        questionIndex,
        field: 'options',
        message: 'Choice questions must have at least 2 options',
      });
      return { question: null, errors };
    }

    const correctCount = options.filter(o => o.isCorrect).length;
    if (correctCount === 0) {
      errors.push({
        questionIndex,
        field: 'options',
        message: 'At least one option must be marked as correct',
      });
      return { question: null, errors };
    }

    if (metadata.type === 'single_choice' && correctCount > 1) {
      errors.push({
        questionIndex,
        field: 'options',
        message: 'Single choice questions must have exactly one correct answer',
      });
      return { question: null, errors };
    }
  }

  if (metadata.type === 'text_input' && !metadata.answer) {
    errors.push({
      questionIndex,
      field: 'answer',
      message: 'Text input questions must have an "answer:" field in metadata',
    });
    return { question: null, errors };
  }

  const question: Question = {
    id: questionId,
    type: metadata.type,
    content,
    options: metadata.type === 'text_input' ? [] : options,
    correctAnswer: metadata.type === 'text_input' ? metadata.answer : undefined,
    explanation: explanation || undefined,
    timeLimit: metadata.timeLimit,
    points: metadata.points,
  };

  return { question, errors };
}

/**
 * Parse question markdown content into Question objects
 * @param markdownContent - Raw markdown string containing questions
 * @returns QuestionParseResult with questions and any validation errors
 */
export function parseQuestionMarkdown(markdownContent: string): QuestionParseResult {
  const questions: Question[] = [];
  const errors: QuestionValidationError[] = [];

  if (!markdownContent || markdownContent.trim() === '') {
    return { questions, errors };
  }

  // Split by question separator (---)
  const blocks = markdownContent.split(/\n---\n/).map(b => b.trim()).filter(Boolean);

  for (let i = 0; i < blocks.length; i++) {
    const result = parseQuestionBlock(blocks[i], i + 1);
    
    if (result.question) {
      questions.push(result.question);
    }
    
    errors.push(...result.errors);
  }

  return { questions, errors };
}

/**
 * Serialize Question objects back to markdown format
 * @param questions - Array of Question objects to serialize
 * @returns Markdown string
 */
export function serializeQuestionMarkdown(questions: Question[]): string {
  if (questions.length === 0) {
    return '';
  }

  const blocks: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const lines: string[] = [];

    // Question header
    const questionNum = q.id.match(/\d+/)?.[0] || String(i + 1);
    lines.push(`# Question ${questionNum}`);
    
    // Metadata
    lines.push(`type: ${q.type}`);
    lines.push(`points: ${q.points}`);
    
    if (q.timeLimit !== undefined) {
      lines.push(`time_limit: ${q.timeLimit}`);
    }
    
    if (q.type === 'text_input' && q.correctAnswer) {
      lines.push(`answer: ${q.correctAnswer}`);
    }

    // Empty line before content
    lines.push('');
    
    // Question content
    lines.push(q.content);

    // Options for choice questions
    if (q.type !== 'text_input' && q.options.length > 0) {
      lines.push('');
      for (const option of q.options) {
        const checkbox = option.isCorrect ? '[x]' : '[ ]';
        lines.push(`- ${checkbox} ${option.text}`);
      }
    }

    // Explanation
    if (q.explanation) {
      lines.push('');
      lines.push('## Explanation');
      lines.push(q.explanation);
    }

    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n---\n\n');
}

/**
 * Check if question parse result has any errors
 */
export function hasQuestionParseErrors(result: QuestionParseResult): boolean {
  return result.errors.length > 0;
}

/**
 * Get only valid questions from parse result (ignoring errors)
 */
export function getValidQuestions(result: QuestionParseResult): Question[] {
  return result.questions;
}
