/**
 * Quiz Export Service
 * Exports quiz Q&A results to various formats
 */

import type { QuizResult, Question } from '../types';

/**
 * Results summary statistics
 */
export interface ResultsSummary {
  totalResults: number;
  uniqueQuizzes: number;
  averagePercentage: number;
  averageTimeTaken: number;
  totalCorrect: number;
  totalQuestions: number;
}

/**
 * Calculate summary statistics from quiz results
 */
export function getResultsSummary(results: QuizResult[]): ResultsSummary {
  if (results.length === 0) {
    return {
      totalResults: 0,
      uniqueQuizzes: 0,
      averagePercentage: 0,
      averageTimeTaken: 0,
      totalCorrect: 0,
      totalQuestions: 0,
    };
  }

  const uniqueQuizIds = new Set(results.map((r) => r.quizId));
  const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
  const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);

  return {
    totalResults: results.length,
    uniqueQuizzes: uniqueQuizIds.size,
    averagePercentage: totalPercentage / results.length,
    averageTimeTaken: totalTime / results.length,
    totalCorrect,
    totalQuestions,
  };
}

/**
 * Download all quiz results as CSV summary
 */
export function downloadCSV(results: QuizResult[]): void {
  if (results.length === 0) return;

  const headers = [
    'Quiz Name',
    'Score',
    'Max Score',
    'Percentage',
    'Correct',
    'Total Questions',
    'Time Taken (s)',
    'Completed At',
  ];

  const rows = results.map((r) => [
    r.quizName,
    String(r.score),
    String(r.maxScore),
    `${r.percentage}%`,
    String(r.correctCount),
    String(r.totalQuestions),
    String(r.timeTaken),
    new Date(r.completedAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  link.download = `quiz_results_${timestamp}.csv`;
  link.href = url;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export interface ExportQuizQAOptions {
  result: QuizResult;
  questions: Question[];
  format?: 'txt' | 'csv' | 'json';
  includeExplanations?: boolean;
}

/**
 * Format a single Q&A entry for text export
 */
function formatQAText(
  question: Question,
  answer: { selectedOptions: string[]; textAnswer?: string; isCorrect: boolean; timeTaken: number },
  index: number,
  includeExplanations: boolean
): string {
  const lines: string[] = [];
  
  lines.push(`--- Question ${index + 1} ---`);
  lines.push(`Type: ${question.type.replace('_', ' ')}`);
  lines.push(`Points: ${question.points}`);
  lines.push(`Result: ${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);
  lines.push(`Time: ${answer.timeTaken}s`);
  lines.push('');
  lines.push(`Q: ${question.content}`);
  lines.push('');

  if (question.type === 'text_input') {
    lines.push(`Your Answer: ${answer.textAnswer || '(no answer)'}`);
    if (question.correctAnswer) {
      lines.push(`Correct Answer: ${question.correctAnswer}`);
    }
  } else {
    lines.push('Options:');
    question.options.forEach((opt) => {
      const isSelected = answer.selectedOptions.includes(opt.id);
      const marker = opt.isCorrect ? '[✓]' : '[ ]';
      const selected = isSelected ? ' ← Your answer' : '';
      lines.push(`  ${marker} ${opt.text}${selected}`);
    });
  }

  if (includeExplanations && question.explanation) {
    lines.push('');
    lines.push(`Explanation: ${question.explanation}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Export quiz Q&A to text format
 */
function exportToText(options: ExportQuizQAOptions): string {
  const { result, questions, includeExplanations = true } = options;
  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(50));
  lines.push(`QUIZ RESULTS: ${result.quizName}`);
  lines.push('═'.repeat(50));
  lines.push('');
  lines.push(`Score: ${result.score}/${result.maxScore} (${result.percentage}%)`);
  lines.push(`Correct: ${result.correctCount}/${result.totalQuestions}`);
  lines.push(`Time Taken: ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`);
  lines.push(`Completed: ${new Date(result.completedAt).toLocaleString()}`);
  lines.push('');
  lines.push('═'.repeat(50));
  lines.push('QUESTIONS & ANSWERS');
  lines.push('═'.repeat(50));
  lines.push('');

  // Q&A entries
  result.answers.forEach((answer, index) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question) {
      lines.push(formatQAText(question, answer, index, includeExplanations));
    }
  });

  return lines.join('\n');
}

/**
 * Export quiz Q&A to CSV format
 */
function exportToCSV(options: ExportQuizQAOptions): string {
  const { result, questions, includeExplanations = true } = options;
  const rows: string[][] = [];

  // Header row
  const headers = [
    'Question #',
    'Type',
    'Question',
    'Your Answer',
    'Correct Answer',
    'Result',
    'Points',
    'Time (s)',
  ];
  if (includeExplanations) {
    headers.push('Explanation');
  }
  rows.push(headers);

  // Data rows
  result.answers.forEach((answer, index) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    let userAnswer = '';
    let correctAnswer = '';

    if (question.type === 'text_input') {
      userAnswer = answer.textAnswer || '';
      correctAnswer = question.correctAnswer || '';
    } else {
      userAnswer = question.options
        .filter((opt) => answer.selectedOptions.includes(opt.id))
        .map((opt) => opt.text)
        .join('; ');
      correctAnswer = question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.text)
        .join('; ');
    }

    const row = [
      String(index + 1),
      question.type.replace('_', ' '),
      question.content.replace(/\n/g, ' '),
      userAnswer,
      correctAnswer,
      answer.isCorrect ? 'Correct' : 'Incorrect',
      String(question.points),
      String(answer.timeTaken),
    ];

    if (includeExplanations) {
      row.push(question.explanation || '');
    }

    rows.push(row);
  });

  // Convert to CSV string with proper escaping
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Export quiz Q&A to JSON format
 */
function exportToJSON(options: ExportQuizQAOptions): string {
  const { result, questions, includeExplanations = true } = options;

  const exportData = {
    quiz: {
      name: result.quizName,
      completedAt: result.completedAt,
    },
    summary: {
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timeTaken: result.timeTaken,
    },
    questions: result.answers.map((answer, index) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return null;

      const entry: Record<string, unknown> = {
        number: index + 1,
        type: question.type,
        content: question.content,
        points: question.points,
        isCorrect: answer.isCorrect,
        timeTaken: answer.timeTaken,
      };

      if (question.type === 'text_input') {
        entry.userAnswer = answer.textAnswer || '';
        entry.correctAnswer = question.correctAnswer || '';
      } else {
        entry.options = question.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          wasSelected: answer.selectedOptions.includes(opt.id),
        }));
      }

      if (includeExplanations && question.explanation) {
        entry.explanation = question.explanation;
      }

      return entry;
    }).filter(Boolean),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export quiz Q&A results and trigger download
 */
export function exportQuizQA(options: ExportQuizQAOptions): void {
  const { result, format = 'txt' } = options;

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'csv':
      content = exportToCSV(options);
      mimeType = 'text/csv;charset=utf-8';
      extension = 'csv';
      break;
    case 'json':
      content = exportToJSON(options);
      mimeType = 'application/json;charset=utf-8';
      extension = 'json';
      break;
    case 'txt':
    default:
      content = exportToText(options);
      mimeType = 'text/plain;charset=utf-8';
      extension = 'txt';
      break;
  }

  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeName = result.quizName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date(result.completedAt).toISOString().split('T')[0];
  link.download = `quiz_${safeName}_${timestamp}.${extension}`;
  link.href = url;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
