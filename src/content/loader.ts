/**
 * Content Loader
 * Loads and caches CSV content with automatic validation
 * Supports multi-language content with LocalizedString fields
 * 
 * Refactored to use PapaParse directly with lazy loading,
 * caching, and request deduplication built-in.
 */

import { parseCSV } from './utils/csv-parser';
import { 
  LRUCache, 
  IndexedDBCache,
  parseCSVChunked, 
  paginate, 
  createPaginatedAccessor,
  getVirtualListItems,
  batchProcess,
  createDebouncedSearch,
  type CacheStats,
  type PaginatedResult,
  type VirtualListResult,
  type ChunkProgress,
} from './utils/performance';
import type { Guide, Character, Event, Festival, Gacha, Swimsuit, Item, Episode, Category, Tag, Tool, BaseContent, SwimsuitSkill } from './schemas/content.schema';
import type { LocalizedString } from '../shared/types/localization';

/**
 * Configuration for ContentLoader performance tuning
 */
export interface ContentLoaderConfig {
  /** Enable LRU cache with TTL (default: true) */
  useLRUCache?: boolean;
  /** Cache TTL in milliseconds (default: 10 minutes) */
  cacheTTL?: number;
  /** Max cache entries (default: 50) */
  maxCacheEntries?: number;
  /** Max cache memory in bytes (default: 100MB) */
  maxCacheMemory?: number;
  /** Use chunked parsing for large files (default: true for >5000 rows) */
  useChunkedParsing?: boolean;
  /** Chunk size for parsing (default: 1000) */
  chunkSize?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Enable IndexedDB persistence for large datasets (default: false) */
  useIndexedDB?: boolean;
  /** IndexedDB TTL in milliseconds (default: 24 hours) */
  idbTTL?: number;
  /** Progress callback for chunked parsing */
  onParseProgress?: (contentType: string, progress: ChunkProgress) => void;
}

const DEFAULT_CONFIG: Required<ContentLoaderConfig> = {
  useLRUCache: true,
  cacheTTL: 10 * 60 * 1000, // 10 minutes
  maxCacheEntries: 50,
  maxCacheMemory: 100 * 1024 * 1024, // 100MB
  useChunkedParsing: true,
  chunkSize: 1000,
  debug: false,
  useIndexedDB: false,
  idbTTL: 24 * 60 * 60 * 1000, // 24 hours
  onParseProgress: undefined as unknown as (contentType: string, progress: ChunkProgress) => void,
};

// Re-export Festival type for lookup map
type FestivalType = Festival;

// Import CSV files as raw text
import guidesCSV from './data/guides.csv?raw';
import charactersCSV from './data/characters.csv?raw';
import eventsCSV from './data/events.csv?raw';
import swimsuitsCSV from './data/swimsuits.csv?raw';
import itemsCSV from './data/items.csv?raw';
import categoriesCSV from './data/categories.csv?raw';
import tagsCSV from './data/tags.csv?raw';
import gachasCSV from './data/gachas.csv?raw';
import episodesCSV from './data/episodes.csv?raw';
import toolsCSV from './data/tools.csv?raw';

/**
 * Helper function to create a LocalizedString from CSV fields
 * Looks for fields with _en, _jp, _cn, _tw, _kr suffixes
 */
export function createLocalizedStringFromCSV(raw: any, fieldName: string): LocalizedString {
  return {
    en: raw[`${fieldName}_en`] || raw[fieldName] || '',
    jp: raw[`${fieldName}_jp`] || raw[fieldName] || '',
    cn: raw[`${fieldName}_cn`] || undefined,
    tw: raw[`${fieldName}_tw`] || undefined,
    kr: raw[`${fieldName}_kr`] || undefined,
  };
}

/**
 * Helper function to create a LocalizedString from a single value (fallback)
 * Uses the same value for both en and jp (required fields)
 */
export function createLocalizedString(value: string): LocalizedString {
  return {
    en: value,
    jp: value,
  };
}

/**
 * Transform raw character data to include LocalizedString fields
 */
export function transformCharacter(raw: any): Character {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.name_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.summary || `${raw.name_en || raw.title || 'Character'} - ${raw.type} Character`,
    category: 'Characters',
    tags: raw.tags ? raw.tags.split('|') : ['Stats'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    type: raw.type,
    image: raw.image,
    stats: typeof raw.stats === 'string' ? JSON.parse(raw.stats) : raw.stats,
    // LocalizedString fields
    name: createLocalizedStringFromCSV(raw, 'name'),
    age: raw.age_en ? createLocalizedStringFromCSV(raw, 'age') : undefined,
    birthday: createLocalizedStringFromCSV(raw, 'birthday'),
    height: createLocalizedStringFromCSV(raw, 'height'),
    measurements: raw.measurements_en ? createLocalizedStringFromCSV(raw, 'measurements') : undefined,
    blood_type: raw.blood_type_en ? createLocalizedStringFromCSV(raw, 'blood_type') : undefined,
    job: raw.job_en ? createLocalizedStringFromCSV(raw, 'job') : undefined,
    hobby: createLocalizedStringFromCSV(raw, 'hobby'),
    food: raw.food_en ? createLocalizedStringFromCSV(raw, 'food') : undefined,
    color: raw.color_en ? createLocalizedStringFromCSV(raw, 'color') : undefined,
    cast: raw.cast_en ? { en: raw.cast_en, jp: raw.cast_jp } : undefined,
  };
}


/**
 * Transform raw swimsuit data to include LocalizedString fields
 */
export function transformSwimsuit(raw: any): Swimsuit {
  // Transform skills from CSV fields
  const skills: SwimsuitSkill[] = [];
  
  if (raw.skill1_name_en) {
    skills.push({
      name: createLocalizedStringFromCSV(raw, 'skill1_name'),
      description: createLocalizedStringFromCSV(raw, 'skill1_desc'),
    });
  }
  if (raw.skill2_name_en) {
    skills.push({
      name: createLocalizedStringFromCSV(raw, 'skill2_name'),
      description: createLocalizedStringFromCSV(raw, 'skill2_desc'),
    });
  }
  if (raw.skill3_name_en) {
    skills.push({
      name: createLocalizedStringFromCSV(raw, 'skill3_name'),
      description: createLocalizedStringFromCSV(raw, 'skill3_desc'),
    });
  }

  return {
    id: parseInt(raw.id) || 0,
    title: raw.name_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.summary || `${raw.name_en || raw.title || 'Swimsuit'} (${raw.rarity}) for ${raw.character_id}`,
    category: 'Swimsuits',
    tags: raw.tags ? raw.tags.split('|') : ['Suits'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    rarity: raw.rarity,
    character: raw.character_id ? raw.character_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '',
    character_id: raw.character_id,
    image: raw.image,
    stats: typeof raw.stats === 'string' ? JSON.parse(raw.stats) : raw.stats,
    // LocalizedString fields
    name: createLocalizedStringFromCSV(raw, 'name'),
    skills,
    // Numeric stat fields
    max_level: raw.max_level ? parseInt(raw.max_level) : undefined,
    base_pow: raw.base_pow ? parseInt(raw.base_pow) : undefined,
    max_pow: raw.max_pow ? parseInt(raw.max_pow) : undefined,
    base_tec: raw.base_tec ? parseInt(raw.base_tec) : undefined,
    max_tec: raw.max_tec ? parseInt(raw.max_tec) : undefined,
    base_stm: raw.base_stm ? parseInt(raw.base_stm) : undefined,
    max_stm: raw.max_stm ? parseInt(raw.max_stm) : undefined,
    base_apl: raw.base_apl ? parseInt(raw.base_apl) : undefined,
    max_apl: raw.max_apl ? parseInt(raw.max_apl) : undefined,
    pow_growth: raw.pow_growth ? parseFloat(raw.pow_growth) : undefined,
    tec_growth: raw.tec_growth ? parseFloat(raw.tec_growth) : undefined,
    stm_growth: raw.stm_growth ? parseFloat(raw.stm_growth) : undefined,
    apl_growth: raw.apl_growth ? parseFloat(raw.apl_growth) : undefined,
  };
}

/**
 * Transform raw event data to include LocalizedString fields
 */
export function transformEvent(raw: any): Event {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.name_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.description_en || raw.summary || '',
    category: 'Events',
    tags: raw.tags ? raw.tags.split('|') : ['Events'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    type: raw.type,
    event_status: raw.event_status,
    start_date: raw.start_date ? new Date(raw.start_date) : new Date(),
    end_date: raw.end_date ? new Date(raw.end_date) : new Date(),
    image: raw.image,
    rewards: raw.rewards_en ? raw.rewards_en.split('|') : [],
    how_to_participate: raw.how_to_participate_en ? raw.how_to_participate_en.split('|') : [],
    tips: raw.tips_en ? raw.tips_en.split('|') : [],
    // LocalizedString fields
    name: createLocalizedStringFromCSV(raw, 'name'),
    description: raw.description_en ? createLocalizedStringFromCSV(raw, 'description') : undefined,
  };
}

/**
 * Transform raw item data to include LocalizedString fields
 */
export function transformItem(raw: any): Item {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.name_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.description_en || raw.summary || '',
    category: 'Items',
    tags: raw.tags ? raw.tags.split('|') : ['Items'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    type: raw.type,
    rarity: raw.rarity,
    image: raw.image,
    // LocalizedString fields
    name: createLocalizedStringFromCSV(raw, 'name'),
    description: raw.description_en ? createLocalizedStringFromCSV(raw, 'description') : undefined,
  };
}

/**
 * Transform raw guide data to include LocalizedString fields
 */
export function transformGuide(raw: any): Guide {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.title_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.summary_en || raw.summary || '',
    category: raw.category_id || 'beginner',
    tags: raw.tags ? raw.tags.split('|') : (raw.topics ? raw.topics.split('|') : ['Guide']),
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    content_ref: raw.content_ref,
    difficulty: raw.difficulty,
    read_time: raw.read_time,
    image: raw.image,
    topics: raw.topics ? raw.topics.split('|') : [],
    // LocalizedString fields
    localizedTitle: createLocalizedStringFromCSV(raw, 'title'),
    localizedSummary: createLocalizedStringFromCSV(raw, 'summary'),
    content: createLocalizedString(raw.content_ref || ''),
  };
}

/**
 * Transform raw gacha data from CSV to Gacha type
 */
export function transformGacha(raw: any): Gacha {
  return {
    id: parseInt(raw.id) || 0,
    unique_key: raw.unique_key || raw.slug,
    image: raw.image,
    name: createLocalizedStringFromCSV(raw, 'name'),
    start_date: raw.start_date ? new Date(raw.start_date) : new Date(),
    end_date: raw.end_date ? new Date(raw.end_date) : new Date(),
    gacha_status: raw.gacha_status === 'Active' ? 'Active' : 
            raw.gacha_status === 'Coming Soon' ? 'Coming Soon' : 'Ended',
    rates: {
      ssr: parseFloat(raw.rates_ssr) || 3,
      sr: parseFloat(raw.rates_sr) || 17,
      r: parseFloat(raw.rates_r) || 80,
    },
    pity_at: parseInt(raw.pity_at) || 100,
    step_up: raw.step_up === 'true' || raw.step_up === true,
    featured_swimsuits: raw.featured_swimsuits ? raw.featured_swimsuits.split('|') : [],
    featured_characters: raw.featured_characters ? raw.featured_characters.split('|') : [],
  };
}

/**
 * Transform raw episode data to include LocalizedString fields
 */
export function transformEpisode(raw: any): Episode {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.name_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.description_en || raw.summary || '',
    category: 'Episodes',
    tags: raw.tags ? raw.tags.split('|') : ['Episodes'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    type: raw.type,
    episode_status: raw.episode_status,
    release_version: raw.release_version,
    release_date: raw.release_date ? new Date(raw.release_date) : undefined,
    image: raw.image,
    character_ids: raw.character_ids ? raw.character_ids.split('|') : [],
    // LocalizedString fields
    name: createLocalizedStringFromCSV(raw, 'name'),
    description: raw.description_en ? createLocalizedStringFromCSV(raw, 'description') : undefined,
  };
}

/**
 * Transform raw category data from CSV
 * Category uses simple string fields (not LocalizedString pattern)
 */
export function transformCategory(raw: any): Category {
  return {
    id: parseInt(raw.id) || 0,
    name: createLocalizedStringFromCSV(raw, 'name'),
    unique_key: raw.unique_key,
    description: createLocalizedStringFromCSV(raw, 'description'),
    parent_id: raw.parent_id || undefined,
    order: parseInt(raw.order) || 0,
  };
}

/**
 * Transform raw tag data from CSV
 * Tag uses simple string fields (not LocalizedString pattern)
 */
export function transformTag(raw: any): Tag {
  return {
    id: parseInt(raw.id) || 0,
    name: createLocalizedStringFromCSV(raw, 'name'),
    unique_key: raw.unique_key,
    description: raw.description ? createLocalizedStringFromCSV(raw, 'description') : undefined,
    usage_count: parseInt(raw.usage_count) || 0,
  };
}

/**
 * Transform raw tool data from CSV to Tool type
 */
export function transformTool(raw: any): Tool {
  return {
    id: parseInt(raw.id) || 0,
    title: raw.title_en || raw.title || '',
    unique_key: raw.unique_key,
    summary: raw.summary_en || raw.summary || '',
    category: raw.category_id || 'utilities',
    tags: raw.tags ? raw.tags.split('|') : ['Tools'],
    updated_at: raw.updated_at,
    author: raw.author,
    status: raw.status,
    related_ids: raw.related_ids ? raw.related_ids.split('|') : [],
    content_ref: raw.content_ref,
    image: raw.image,
    windows_path: raw.windows_path || undefined,
    version: raw.version || undefined,
    // LocalizedString fields
    localizedTitle: createLocalizedStringFromCSV(raw, 'title'),
    localizedSummary: createLocalizedStringFromCSV(raw, 'summary'),
  };
}


/**
 * Content type identifiers for the loader
 */
export type ContentType =
  | 'characters'
  | 'guides'
  | 'events'
  | 'swimsuits'
  | 'items'
  | 'episodes'
  | 'gachas'
  | 'categories'
  | 'tags'
  | 'festivals'
  | 'tools';

/**
 * Error thrown when content loading fails
 */
export class ContentLoadError extends Error {
  constructor(
    public contentType: string,
    public cause: Error | string[]
  ) {
    const message = Array.isArray(cause) 
      ? `Failed to load ${contentType}: ${cause.join(', ')}`
      : `Failed to load ${contentType}: ${cause.message}`;
    super(message);
    this.name = 'ContentLoadError';
  }
}

/**
 * ContentLoader - Singleton class for loading and caching CSV content
 * 
 * Features:
 * - Lazy loading: Content is only loaded when first requested
 * - LRU Caching: Memory-bounded cache with TTL and automatic eviction
 * - Request deduplication: Concurrent requests for the same content share a single parse operation
 * - Chunked parsing: Non-blocking parsing for large datasets
 * - O(1) Lookup Maps: Pre-built indexes for fast access by ID and unique_key
 */
export class ContentLoader {
  private static instance: ContentLoader;
  private config: Required<ContentLoaderConfig>;
  private lruCache: LRUCache<unknown[]>;
  private idbCache: IndexedDBCache<unknown[]> | null = null;
  private simpleCache: Map<string, unknown[]> = new Map(); // Fallback for non-LRU mode
  private pendingRequests: Map<string, Promise<unknown[]>> = new Map();
  private parseMetrics: Map<string, { parseTime: number; rowCount: number }> = new Map();
  private searchInstances: Map<string, ReturnType<typeof createDebouncedSearch<BaseContent>>> = new Map();
  
  // O(1) Lookup Maps for fast access
  private charactersByKey: Map<string, Character> = new Map();
  private charactersByIndex: Map<number, Character> = new Map();
  private swimsuitsByKey: Map<string, Swimsuit> = new Map();
  private swimsuitsByIndex: Map<number, Swimsuit> = new Map();
  private eventsByKey: Map<string, Event> = new Map();
  private eventsByIndex: Map<number, Event> = new Map();
  private guidesByKey: Map<string, Guide> = new Map();
  private guidesByIndex: Map<number, Guide> = new Map();
  private itemsByKey: Map<string, Item> = new Map();
  private itemsByIndex: Map<number, Item> = new Map();
  private episodesByKey: Map<string, Episode> = new Map();
  private episodesByIndex: Map<number, Episode> = new Map();
  private gachasByKey: Map<string, Gacha> = new Map();
  private gachasByIndex: Map<number, Gacha> = new Map();
  private festivalsByKey: Map<string, Festival> = new Map();
  private categoriesByKey: Map<string, Category> = new Map();
  private tagsByKey: Map<string, Tag> = new Map();
  private toolsByKey: Map<string, Tool> = new Map();
  private toolsByIndex: Map<number, Tool> = new Map();

  private constructor(config: ContentLoaderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lruCache = new LRUCache<unknown[]>({
      maxEntries: this.config.maxCacheEntries,
      maxMemorySize: this.config.maxCacheMemory,
      ttl: this.config.cacheTTL,
      persistToStorage: false,
    });
    if (this.config.useIndexedDB) {
      this.idbCache = new IndexedDBCache<unknown[]>('content-loader-db', 'content', '1.0.0', this.config.idbTTL);
    }
  }

  static getInstance(config?: ContentLoaderConfig): ContentLoader {
    if (!ContentLoader.instance) {
      ContentLoader.instance = new ContentLoader(config);
    }
    return ContentLoader.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    ContentLoader.instance = undefined as unknown as ContentLoader;
  }

  /**
   * Update configuration at runtime
   */
  configure(config: Partial<ContentLoaderConfig>): void {
    this.config = { ...this.config, ...config };
    // Recreate LRU cache with new settings
    if (config.maxCacheEntries || config.maxCacheMemory || config.cacheTTL) {
      const oldStats = this.lruCache.getStats();
      this.lruCache = new LRUCache<unknown[]>({
        maxEntries: this.config.maxCacheEntries,
        maxMemorySize: this.config.maxCacheMemory,
        ttl: this.config.cacheTTL,
      });
      if (this.config.debug) {
        console.log('[ContentLoader] Cache reconfigured, old stats:', oldStats);
      }
    }
    // Handle IndexedDB config changes
    if (config.useIndexedDB !== undefined) {
      if (config.useIndexedDB && !this.idbCache) {
        this.idbCache = new IndexedDBCache<unknown[]>('content-loader-db', 'content', '1.0.0', this.config.idbTTL);
      } else if (!config.useIndexedDB && this.idbCache) {
        this.idbCache.close();
        this.idbCache = null;
      }
    }
  }

  /**
   * Check if the cache is empty (useful for testing lazy loading)
   */
  isCacheEmpty(): boolean {
    return this.config.useLRUCache 
      ? this.lruCache.getStats().entryCount === 0
      : this.simpleCache.size === 0;
  }

  /**
   * Get the number of cached content types
   */
  getCacheSize(): number {
    return this.config.useLRUCache 
      ? this.lruCache.getStats().entryCount
      : this.simpleCache.size;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): CacheStats {
    return this.lruCache.getStats();
  }

  /**
   * Get parse metrics for performance monitoring
   */
  getParseMetrics(): Map<string, { parseTime: number; rowCount: number }> {
    return new Map(this.parseMetrics);
  }

  /**
   * Get cached data if available (sync - memory only)
   */
  private getCached<T>(key: string): T[] | undefined {
    if (this.config.useLRUCache) {
      return this.lruCache.get(key) as T[] | undefined;
    }
    return this.simpleCache.get(key) as T[] | undefined;
  }

  /**
   * Get cached data with IndexedDB fallback (async)
   */
  private async getCachedAsync<T>(key: string): Promise<T[] | undefined> {
    // Try memory cache first
    const memCached = this.getCached<T>(key);
    if (memCached) return memCached;
    
    // Try IndexedDB if enabled
    if (this.idbCache) {
      const idbData = await this.idbCache.get(key) as T[] | undefined;
      if (idbData) {
        this.setCache(key, idbData); // Populate memory cache
        return idbData;
      }
    }
    return undefined;
  }

  /**
   * Set data in cache (memory + optional IndexedDB)
   */
  private setCache<T>(key: string, data: T[]): void {
    if (this.config.useLRUCache) {
      this.lruCache.set(key, data);
    } else {
      this.simpleCache.set(key, data);
    }
    // Persist to IndexedDB asynchronously
    if (this.idbCache) {
      this.idbCache.set(key, data).catch(() => {});
    }
  }

  /**
   * Unified content loading method with caching and deduplication
   */
  private async loadContent<T>(
    key: string,
    csvContent: string,
    transformer: (raw: Record<string, string>) => T
  ): Promise<T[]> {
    // Check cache first (including IndexedDB)
    const cached = await this.getCachedAsync<T>(key);
    if (cached) {
      if (this.config.debug) console.log(`[ContentLoader] Cache hit: ${key}`);
      return cached;
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T[]>;
    }

    // Create the loading promise
    const promise = this.parseAndTransform(key, csvContent, transformer);
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      this.setCache(key, data);
      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Parse CSV content and transform to typed objects
   * Uses chunked parsing for large datasets to avoid blocking UI
   */
  private async parseAndTransform<T>(
    key: string,
    csvContent: string,
    transformer: (raw: Record<string, string>) => T
  ): Promise<T[]> {
    const startTime = performance.now();
    const estimatedRows = (csvContent.match(/\n/g) || []).length;
    const useChunked = this.config.useChunkedParsing && estimatedRows > 5000;

    let data: T[];
    
    if (useChunked) {
      if (this.config.debug) console.log(`[ContentLoader] Chunked parsing: ${key} (~${estimatedRows} rows)`);
      
      const result = await parseCSVChunked<T>(csvContent, {
        chunkSize: this.config.chunkSize,
        transform: transformer,
        onProgress: (p) => {
          if (this.config.debug) console.log(`[ContentLoader] ${key}: ${p.percentage.toFixed(1)}%`);
          this.config.onParseProgress?.(key, p);
        },
      });
      
      data = result.data;
      this.parseMetrics.set(key, { parseTime: result.parseTime, rowCount: result.totalRows });
    } else {
      const { data: rawData, errors } = parseCSV<Record<string, string>>(csvContent);

      if (errors.length > 0 && import.meta.env.DEV) {
        const criticalErrors = errors.filter(e => e.type === 'Quotes' || e.type === 'Delimiter');
        if (criticalErrors.length > 0) console.warn(`CSV parse errors for ${key}:`, criticalErrors);
      }

      if (rawData.length === 0) throw new ContentLoadError(key, ['No data found in CSV']);

      // Use batch processing for large transforms
      data = rawData.length > 1000 
        ? await batchProcess(rawData, transformer, 500)
        : rawData.map(transformer);
      
      this.parseMetrics.set(key, { parseTime: performance.now() - startTime, rowCount: rawData.length });
    }

    if (this.config.debug) {
      const m = this.parseMetrics.get(key)!;
      console.log(`[ContentLoader] Parsed ${key}: ${m.rowCount} rows in ${m.parseTime.toFixed(2)}ms`);
    }

    return data;
  }

  // ============================================================================
  // Public async loading methods (lazy loading)
  // ============================================================================

  /**
   * Initialize all content types at once
   * Useful for preloading all data at app startup
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadCharacters(),
      this.loadGuides(),
      this.loadEvents(),
      this.loadSwimsuits(),
      this.loadItems(),
      this.loadEpisodes(),
      this.loadGachas(),
      this.loadCategories(),
      this.loadTags(),
      this.loadTools(),
    ]);
  }

  async loadCharacters(): Promise<Character[]> {
    const characters = await this.loadContent('characters', charactersCSV, transformCharacter);
    
    // Build O(1) lookup maps
    this.charactersByKey.clear();
    this.charactersByIndex.clear();
    for (const char of characters) {
      this.charactersByKey.set(char.unique_key, char);
      this.charactersByIndex.set(char.id, char);
    }
    
    return characters;
  }

  async loadGuides(): Promise<Guide[]> {
    const guides = await this.loadContent('guides', guidesCSV, transformGuide);
    
    // Build O(1) lookup maps
    this.guidesByKey.clear();
    this.guidesByIndex.clear();
    for (const guide of guides) {
      this.guidesByKey.set(guide.unique_key, guide);
      this.guidesByIndex.set(guide.id, guide);
    }
    
    return guides;
  }

  async loadEvents(): Promise<Event[]> {
    const events = await this.loadContent('events', eventsCSV, transformEvent);
    
    // Build O(1) lookup maps
    this.eventsByKey.clear();
    this.eventsByIndex.clear();
    for (const event of events) {
      this.eventsByKey.set(event.unique_key, event);
      this.eventsByIndex.set(event.id, event);
    }
    
    // Also cache festivals (events with type 'Festival')
    if (!this.getCached<Festival>('festivals')) {
      const festivals = events.filter((e: Event) => e.type === 'Festival') as FestivalType[];
      this.setCache('festivals', festivals);
      
      // Build festival lookup map
      this.festivalsByKey.clear();
      for (const festival of festivals) {
        this.festivalsByKey.set(festival.unique_key, festival);
      }
    }
    
    return events;
  }

  async loadSwimsuits(): Promise<Swimsuit[]> {
    const swimsuits = await this.loadContent('swimsuits', swimsuitsCSV, transformSwimsuit);
    
    // Build O(1) lookup maps
    this.swimsuitsByKey.clear();
    this.swimsuitsByIndex.clear();
    for (const suit of swimsuits) {
      this.swimsuitsByKey.set(suit.unique_key, suit);
      this.swimsuitsByIndex.set(suit.id, suit);
    }
    
    return swimsuits;
  }

  async loadItems(): Promise<Item[]> {
    const items = await this.loadContent('items', itemsCSV, transformItem);
    
    // Build O(1) lookup maps
    this.itemsByKey.clear();
    this.itemsByIndex.clear();
    for (const item of items) {
      this.itemsByKey.set(item.unique_key, item);
      this.itemsByIndex.set(item.id, item);
    }
    
    return items;
  }

  async loadEpisodes(): Promise<Episode[]> {
    const episodes = await this.loadContent('episodes', episodesCSV, transformEpisode);
    
    // Build O(1) lookup maps
    this.episodesByKey.clear();
    this.episodesByIndex.clear();
    for (const episode of episodes) {
      this.episodesByKey.set(episode.unique_key, episode);
      this.episodesByIndex.set(episode.id, episode);
    }
    
    return episodes;
  }

  async loadGachas(): Promise<Gacha[]> {
    const gachas = await this.loadContent('gachas', gachasCSV, transformGacha);
    
    // Build O(1) lookup maps
    this.gachasByKey.clear();
    this.gachasByIndex.clear();
    for (const gacha of gachas) {
      this.gachasByKey.set(gacha.unique_key, gacha);
      this.gachasByIndex.set(gacha.id, gacha);
    }
    
    return gachas;
  }

  async loadCategories(): Promise<Category[]> {
    const categories = await this.loadContent('categories', categoriesCSV, transformCategory);
    
    // Build O(1) lookup map
    this.categoriesByKey.clear();
    for (const category of categories) {
      this.categoriesByKey.set(category.unique_key, category);
    }
    
    return categories;
  }

  async loadTags(): Promise<Tag[]> {
    const tags = await this.loadContent('tags', tagsCSV, transformTag);
    
    // Build O(1) lookup map
    this.tagsByKey.clear();
    for (const tag of tags) {
      this.tagsByKey.set(tag.unique_key, tag);
    }
    
    return tags;
  }

  async loadFestivals(): Promise<Festival[]> {
    // Ensure events are loaded first (which caches festivals)
    await this.loadEvents();
    return this.getCached<Festival>('festivals') || [];
  }

  async loadTools(): Promise<Tool[]> {
    const tools = await this.loadContent('tools', toolsCSV, transformTool);
    
    // Build O(1) lookup maps
    this.toolsByKey.clear();
    this.toolsByIndex.clear();
    for (const tool of tools) {
      this.toolsByKey.set(tool.unique_key, tool);
      this.toolsByIndex.set(tool.id, tool);
    }
    
    return tools;
  }


  // ============================================================================
  // Synchronous getters (return cached data or empty array)
  // ============================================================================

  getCategories(): Category[] {
    return this.getCached<Category>('categories') || [];
  }

  getTags(): Tag[] {
    return this.getCached<Tag>('tags') || [];
  }

  getGuides(): Guide[] {
    return this.getCached<Guide>('guides') || [];
  }

  getCharacters(): Character[] {
    return this.getCached<Character>('characters') || [];
  }

  getEvents(): Event[] {
    return this.getCached<Event>('events') || [];
  }

  getSwimsuits(): Swimsuit[] {
    return this.getCached<Swimsuit>('swimsuits') || [];
  }

  getItems(): Item[] {
    return this.getCached<Item>('items') || [];
  }

  getEpisodes(): Episode[] {
    return this.getCached<Episode>('episodes') || [];
  }

  getFestivals(): Festival[] {
    return this.getCached<Festival>('festivals') || [];
  }

  getGachas(): Gacha[] {
    return this.getCached<Gacha>('gachas') || [];
  }

  getTools(): Tool[] {
    return this.getCached<Tool>('tools') || [];
  }

  // ============================================================================
  // Find by ID methods - O(1) using lookup maps
  // ============================================================================

  getGuideById(id: number): Guide | undefined {
    return this.guidesByIndex.get(id);
  }

  getCharacterById(id: number): Character | undefined {
    return this.charactersByIndex.get(id);
  }

  getEventById(id: number): Event | undefined {
    return this.eventsByIndex.get(id);
  }

  getSwimsuitById(id: number): Swimsuit | undefined {
    return this.swimsuitsByIndex.get(id);
  }

  getItemById(id: number): Item | undefined {
    return this.itemsByIndex.get(id);
  }

  getEpisodeById(id: number): Episode | undefined {
    return this.episodesByIndex.get(id);
  }

  getCategoryById(id: number): Category | undefined {
    const categories = this.getCategories();
    return categories.find(c => c.id === id);
  }

  getTagById(id: number): Tag | undefined {
    const tags = this.getTags();
    return tags.find(t => t.id === id);
  }

  getGachaById(id: number): Gacha | undefined {
    return this.gachasByIndex.get(id);
  }

  getToolById(id: number): Tool | undefined {
    return this.toolsByIndex.get(id);
  }

  // ============================================================================
  // Find by unique_key methods - O(1) using lookup maps
  // ============================================================================

  getGuideByUniqueKey(uniqueKey: string): Guide | undefined {
    return this.guidesByKey.get(uniqueKey);
  }

  getCharacterByUniqueKey(uniqueKey: string): Character | undefined {
    return this.charactersByKey.get(uniqueKey);
  }

  getEventByUniqueKey(uniqueKey: string): Event | undefined {
    return this.eventsByKey.get(uniqueKey);
  }

  getSwimsuitByUniqueKey(uniqueKey: string): Swimsuit | undefined {
    return this.swimsuitsByKey.get(uniqueKey);
  }

  getItemByUniqueKey(uniqueKey: string): Item | undefined {
    return this.itemsByKey.get(uniqueKey);
  }

  getEpisodeByUniqueKey(uniqueKey: string): Episode | undefined {
    return this.episodesByKey.get(uniqueKey);
  }

  getFestivalByUniqueKey(uniqueKey: string): Festival | undefined {
    return this.festivalsByKey.get(uniqueKey);
  }

  getGachaByUniqueKey(uniqueKey: string): Gacha | undefined {
    return this.gachasByKey.get(uniqueKey);
  }

  getCategoryByUniqueKey(uniqueKey: string): Category | undefined {
    return this.categoriesByKey.get(uniqueKey);
  }

  getTagByUniqueKey(uniqueKey: string): Tag | undefined {
    return this.tagsByKey.get(uniqueKey);
  }

  getToolByUniqueKey(uniqueKey: string): Tool | undefined {
    return this.toolsByKey.get(uniqueKey);
  }

  // ============================================================================
  // Utility methods
  // ============================================================================

  /**
   * Get related content for an item
   */
  getRelatedContent<T extends BaseContent>(
    item: T,
    allContent: T[]
  ): T[] {
    if (!item.related_ids || item.related_ids.length === 0) return [];
    // Match related_ids (strings) against unique_key (string)
    return allContent.filter(c => item.related_ids!.includes(c.unique_key));
  }

  /**
   * Filter content by category
   */
  getContentByCategory<T extends BaseContent>(
    content: T[],
    categoryId: string
  ): T[] {
    return content.filter(c => c.category === categoryId);
  }

  /**
   * Filter content by tag
   */
  getContentByTag<T extends BaseContent>(
    content: T[],
    tagId: string
  ): T[] {
    return content.filter(c => c.tags.includes(tagId));
  }

  /**
   * Clear cache and all lookup maps to allow fresh loading
   */
  clearCache(): void {
    if (this.config.useLRUCache) this.lruCache.clear();
    else this.simpleCache.clear();
    
    this.pendingRequests.clear();
    this.parseMetrics.clear();
    this.searchInstances.clear();
    
    // Clear all lookup maps
    [this.charactersByKey, this.charactersByIndex, this.swimsuitsByKey, this.swimsuitsByIndex,
     this.eventsByKey, this.eventsByIndex, this.guidesByKey, this.guidesByIndex,
     this.itemsByKey, this.itemsByIndex, this.episodesByKey, this.episodesByIndex,
     this.gachasByKey, this.gachasByIndex, this.festivalsByKey, this.categoriesByKey,
     this.tagsByKey, this.toolsByKey, this.toolsByIndex].forEach(m => m.clear());
    
    // Clear IndexedDB if enabled
    this.idbCache?.clear().catch(() => {});
  }

  /**
   * Cleanup expired cache entries (call periodically for long-running apps)
   */
  cleanupExpiredCache(): number {
    return this.config.useLRUCache ? this.lruCache.cleanup() : 0;
  }

  // ============================================================================
  // Pagination & Virtual List Utilities
  // ============================================================================

  /**
   * Get paginated content
   */
  paginate<T>(data: T[], page = 1, pageSize = 50): PaginatedResult<T> {
    return paginate(data, page, pageSize);
  }

  /**
   * Create a paginated accessor for efficient page-by-page iteration
   */
  createPaginatedAccessor<T>(data: T[], pageSize = 50) {
    return createPaginatedAccessor(data, pageSize);
  }

  /**
   * Get items for virtual list rendering (windowed)
   */
  getVirtualListItems<T>(
    data: T[],
    scrollTop: number,
    config: { itemHeight: number; containerHeight: number; overscan?: number }
  ): VirtualListResult<T> {
    return getVirtualListItems(data, scrollTop, config);
  }

  // ============================================================================
  // Search Utilities
  // ============================================================================

  /**
   * Create or get a debounced search instance for a content type
   */
  createSearch<T extends BaseContent>(
    contentType: ContentType,
    data: T[],
    searchFn?: (item: T, query: string) => boolean,
    debounceMs = 150
  ) {
    const key = contentType;
    
    // Default search function: search in title and summary
    const defaultSearchFn = (item: T, query: string) => {
      const q = query.toLowerCase();
      return item.title.toLowerCase().includes(q) || 
             (item.summary?.toLowerCase().includes(q) ?? false);
    };
    
    const searcher = createDebouncedSearch(
      data as unknown as BaseContent[], 
      (searchFn ?? defaultSearchFn) as (item: BaseContent, query: string) => boolean, 
      debounceMs
    );
    this.searchInstances.set(key, searcher);
    return searcher as { search: (query: string) => Promise<T[]>; clearCache: () => void };
  }

  /**
   * Quick search across all loaded content types
   */
  async searchAll(query: string): Promise<Map<ContentType, BaseContent[]>> {
    const results = new Map<ContentType, BaseContent[]>();
    const q = query.toLowerCase();
    
    const searchInContent = <T extends BaseContent>(data: T[], type: ContentType) => {
      const matches = data.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.summary?.toLowerCase().includes(q) ?? false)
      );
      if (matches.length > 0) results.set(type, matches);
    };

    // Search in all cached content
    searchInContent(this.getCharacters(), 'characters');
    searchInContent(this.getGuides(), 'guides');
    searchInContent(this.getSwimsuits(), 'swimsuits');
    searchInContent(this.getEvents(), 'events');
    searchInContent(this.getItems(), 'items');
    searchInContent(this.getEpisodes(), 'episodes');
    searchInContent(this.getTools(), 'tools');
    
    return results;
  }

  // ============================================================================
  // Batch Processing Utilities
  // ============================================================================

  /**
   * Process items in batches to avoid blocking UI
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T, index: number) => R,
    batchSize = 100,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    return batchProcess(items, processor, batchSize, onProgress);
  }

  /**
   * Dispose resources (call when app unmounts)
   */
  dispose(): void {
    this.clearCache();
    this.idbCache?.close();
    this.idbCache = null;
  }
}

// Re-export utility types for consumers
export type { PaginatedResult, VirtualListResult, ChunkProgress };

// Export singleton instance
export const contentLoader = ContentLoader.getInstance();
