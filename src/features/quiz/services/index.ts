// Quiz services barrel export
export {
  loadQuizzes,
  getQuizByKey,
  getQuizByKeyAsync,
  loadQuestions,
  filterQuizzes,
  searchQuizzes,
  clearQuizCache,
  getQuizCategories,
  getPublishedQuizzes,
} from './quiz.service';

export {
  createSession,
  submitAnswer,
  validateAnswer,
  validateSingleChoice,
  validateMultipleChoice,
  validateTextInput,
  calculateScore,
  calculateMaxScore,
  calculateCorrectCount,
  calculateTimeTaken,
  completeSession,
  timeoutSession,
  markSessionCompleted,
  updateTimeRemaining,
  hasMoreQuestions,
  getCurrentQuestionIndex,
} from './session.service';

export {
  saveResult,
  loadResults,
  getResultsByQuiz,
  getResultsByUser,
  sortResultsByDate,
  getBestResult,
  deleteResult,
  clearAllResults,
  getResultCount,
  serializeQuizResult,
  deserializeQuizResult,
  serializeUserAnswer,
  deserializeUserAnswer,
} from './result.service';

export {
  downloadCSV,
  getResultsSummary,
  exportQuizQA,
  type ResultsSummary,
  type ExportQuizQAOptions,
} from './export.service';
