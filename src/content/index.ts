/**
 * Content Management System - Main Export
 */

// Loader (with built-in lazy loading, LRU caching, and request deduplication)
export { contentLoader, ContentLoader, ContentLoadError } from './loader';
export type { ContentType, ContentLoaderConfig } from './loader';

// Schemas
export type {
  BaseContent,
  Guide,
  Character,
  Event,
  Festival,
  Swimsuit,
  SwimsuitSkill,
  Item,
  Gacha,
  Episode,
  Category,
  Tag,
  Tool,
  Accessory,
  Mission
} from './schemas/content.schema';

export {
  REQUIRED_FIELDS,
  VALID_STATUSES,
  VALID_RARITIES,
  VALID_ITEM_TYPES,
  VALID_EVENT_TYPES,
  VALID_EVENT_STATUSES,
  VALID_GACHA_STATUSES,
  VALID_EPISODE_TYPES,
  VALID_EPISODE_STATUSES,
  VALID_ACCESSORY_RARITIES,
  VALID_OBTAIN_METHODS,
  VALID_MISSION_TYPES,
  VALID_QUIZ_DIFFICULTIES,
  VALID_QUIZ_STATUSES
} from './schemas/content.schema';

// Utilities
export { 
  parseCSV, 
  serializeCSV, 
  parseArray, 
  parseJSON, 
  parseBoolean, 
  parseNumber, 
  parseDate
} from './utils/csv-parser';
export type { ParseOptions, ParseResult, ParseError } from './utils/csv-parser';

export { ContentValidator } from './utils/validator';
export type { ValidationResult } from './utils/validator';

export { RequestDeduplicator } from './utils/request-deduplicator';

// Image loading utilities
export {
  ImageLoader,
  imageLoader,
  resolveImagePath,
  setImageLoaderConfig,
  getImageLoaderConfig,
  resetImageLoaderConfig,
  setDatasetBasePath,
  getDatasetBasePath,
  isWebUrl,
  isWindowsPath,
  isUnixAbsolutePath,
  normalizeWindowsPath,
  windowsPathToFileUrl,
  unixPathToFileUrl,
} from './utils/image-loader';
export type { ImageLoaderConfig } from './utils/image-loader';

// Hooks
export { useContent, useCharacters, useGuides, useEvents, useCategories, useTags, useTools } from './hooks';
export type { UseContentOptions, UseContentResult } from './hooks';

// Guide content hook
export { useGuideContent } from './hooks';
export type { UseGuideContentResult } from './hooks';

// Image loading hooks
export { useImage, useDatasetPath, useImageLoader, usePreloadImages } from './hooks';
export type { UseImageOptions, UseImageResult } from './hooks';

// Markdown utilities
export {
  getMarkdownContent,
  parseMarkdownSections,
  markdownToHtml,
  getAvailableGuides,
  preloadGuides,
  clearMarkdownCache,
  // Path configuration (similar to image loader)
  setMarkdownLoaderConfig,
  getMarkdownLoaderConfig,
  resetMarkdownLoaderConfig,
  setMarkdownBasePath,
  getMarkdownBasePath,
  resolveMarkdownPath,
  // External content loading
  loadMarkdownContentAsync,
  setExternalMarkdownContent,
  setExternalMarkdownContents,
  clearExternalMarkdownCache,
  hasMarkdownContent,
} from './utils/markdown-loader';
export type { MarkdownSection, MarkdownLoaderConfig } from './utils/markdown-loader';

// Performance utilities for large datasets
export {
  LRUCache,
  IndexedDBCache,
  parseCSVChunked,
  paginate,
  createPaginatedAccessor,
  getVirtualListItems,
  batchProcess,
  createDebouncedSearch,
  lruCache,
  idbCache,
} from './utils/performance';
export type {
  CacheEntry,
  CacheStats,
  CacheOptions,
  ChunkProgress,
  ChunkOptions,
  PaginatedResult,
  VirtualListResult,
} from './utils/performance';
