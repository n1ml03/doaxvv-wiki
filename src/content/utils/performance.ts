/**
 * Performance Utilities for Large CSV Dataset Handling
 * 
 * Module providing:
 * - LRU Cache with TTL and memory management
 * - Chunked/streaming CSV parsing
 * - Pagination and virtual list helpers
 * - IndexedDB persistence for large datasets
 * - Batch processing utilities
 */

import Papa from 'papaparse';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

export interface CacheOptions {
  maxEntries?: number;
  maxMemorySize?: number;
  ttl?: number;
  persistToStorage?: boolean;
  storageKey?: string;
}

export interface ChunkProgress {
  rowsProcessed: number;
  totalRows?: number;
  chunkIndex: number;
  percentage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface VirtualListResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

// ============================================================================
// LRU CACHE WITH TTL
// ============================================================================

const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  maxEntries: 100,
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  ttl: 5 * 60 * 1000, // 5 minutes
  persistToStorage: false,
  storageKey: 'content-cache',
};

function estimateSize(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') return value.length * 2;
  if (typeof value === 'number' || typeof value === 'boolean') return 8;
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => acc + estimateSize(item), 0) + 8;
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce(
      (acc, [key, val]) => acc + key.length * 2 + estimateSize(val), 0
    ) + 8;
  }
  return 8;
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private stats: CacheStats = {
    hits: 0, misses: 0, evictions: 0, totalSize: 0, entryCount: 0, hitRate: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    if (this.options.persistToStorage) this.loadFromStorage();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }
    
    // Check TTL
    if (this.options.ttl > 0 && Date.now() - entry.timestamp > this.options.ttl) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }
    
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  set(key: string, value: T): void {
    const size = estimateSize(value);
    this.evictIfNeeded(size);
    
    if (this.cache.has(key)) {
      this.stats.totalSize -= this.cache.get(key)!.size;
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      size,
    });
    
    this.stats.totalSize += size;
    this.stats.entryCount = this.cache.size;
    
    if (this.options.persistToStorage) this.saveToStorage();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.options.ttl > 0 && Date.now() - entry.timestamp > this.options.ttl) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.totalSize -= entry.size;
      this.cache.delete(key);
      this.stats.entryCount = this.cache.size;
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    if (this.options.persistToStorage) {
      try { localStorage.removeItem(this.options.storageKey); } catch { /* ignore storage errors */ }
    }
  }

  getStats(): CacheStats { return { ...this.stats }; }
  
  cleanup(): number {
    if (this.options.ttl === 0) return 0;
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.options.ttl) {
        this.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  private evictIfNeeded(incomingSize: number): void {
    while (this.cache.size >= this.options.maxEntries) this.evictLRU();
    while (this.stats.totalSize + incomingSize > this.options.maxMemorySize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch { /* ignore storage errors */ }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as [string, CacheEntry<T>][];
        const now = Date.now();
        for (const [key, entry] of data) {
          if (this.options.ttl === 0 || now - entry.timestamp <= this.options.ttl) {
            this.cache.set(key, entry);
            this.stats.totalSize += entry.size;
          }
        }
        this.stats.entryCount = this.cache.size;
      }
    } catch { /* ignore storage errors */ }
  }
}

// ============================================================================
// CHUNKED CSV PARSING
// ============================================================================

export interface ChunkOptions<T> {
  chunkSize?: number;
  onProgress?: (progress: ChunkProgress) => void;
  onChunk?: (chunk: T[], chunkIndex: number) => void;
  transform?: (row: Record<string, string>) => T;
}

export async function parseCSVChunked<T = Record<string, string>>(
  csvContent: string,
  options: ChunkOptions<T> = {}
): Promise<{ data: T[]; totalRows: number; parseTime: number; errors: Papa.ParseError[] }> {
  const { chunkSize = 1000, onProgress, onChunk, transform } = options;
  const startTime = performance.now();
  const allData: T[] = [];
  const allErrors: Papa.ParseError[] = [];
  let rowsProcessed = 0;
  let chunkIndex = 0;

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string): string => h.trim(),
      transform: (v: string): string => v.trim(),
      chunk: (results: Papa.ParseResult<Record<string, string>>, parser: Papa.Parser): void => {
        try {
          const chunk = transform
            ? results.data.map(row => transform(row))
            : results.data as unknown as T[];

          allData.push(...chunk);
          allErrors.push(...results.errors);
          rowsProcessed += results.data.length;
          chunkIndex++;

          if (onProgress) {
            onProgress({
              rowsProcessed,
              chunkIndex,
              percentage: Math.min(99, (rowsProcessed / (rowsProcessed + chunkSize)) * 100),
            });
          }
          if (onChunk) onChunk(chunk, chunkIndex - 1);
        } catch (error) {
          parser.abort();
          reject(error);
        }
      },
      complete: (): void => {
        if (onProgress) {
          onProgress({ rowsProcessed, totalRows: rowsProcessed, chunkIndex, percentage: 100 });
        }
        resolve({ data: allData, totalRows: rowsProcessed, parseTime: performance.now() - startTime, errors: allErrors });
      },
      error: (error: Error): void => reject(new Error(`CSV parsing failed: ${error.message}`)),
      chunkSize: chunkSize * 500,
    });
  });
}

// ============================================================================
// PAGINATION & VIRTUAL LIST
// ============================================================================

export function paginate<T>(data: T[], page = 1, pageSize = 50): PaginatedResult<T> {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const normalizedPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (normalizedPage - 1) * pageSize;

  return {
    data: data.slice(startIndex, Math.min(startIndex + pageSize, totalItems)),
    page: normalizedPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: normalizedPage < totalPages,
    hasPrevPage: normalizedPage > 1,
  };
}

export function createPaginatedAccessor<T>(data: T[], pageSize = 50) {
  const totalPages = Math.ceil(data.length / pageSize);
  return {
    getPage: (page: number) => paginate(data, page, pageSize),
    getTotalPages: () => totalPages,
    getTotalItems: () => data.length,
    *pages(): Generator<PaginatedResult<T>> {
      for (let page = 1; page <= totalPages; page++) yield paginate(data, page, pageSize);
    },
  };
}

export function getVirtualListItems<T>(
  data: T[],
  scrollTop: number,
  config: { itemHeight: number; containerHeight: number; overscan?: number }
): VirtualListResult<T> {
  const { itemHeight, containerHeight, overscan = 3 } = config;
  const totalHeight = data.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(data.length, startIndex + visibleCount + overscan * 2);

  return {
    visibleItems: data.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight,
    offsetY: startIndex * itemHeight,
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  batchSize = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, total));
    for (let j = 0; j < batch.length; j++) {
      results.push(processor(batch[j], i + j));
    }
    if (onProgress) onProgress(Math.min(i + batchSize, total), total);
    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
  }
  return results;
}

// ============================================================================
// INDEXEDDB CACHE (for large datasets)
// ============================================================================

interface IDBEntry<T> { key: string; data: T; timestamp: number; version: string; }

export class IndexedDBCache<T = unknown> {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  
  constructor(
    private dbName = 'content-cache-db',
    private storeName = 'content-store',
    private version = '1.0.0',
    private ttl = 24 * 60 * 60 * 1000
  ) {}

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB not available');

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
    return this.dbPromise;
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const request = tx.objectStore(this.storeName).get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const entry = request.result as IDBEntry<T> | undefined;
          if (!entry || entry.version !== this.version || Date.now() - entry.timestamp > this.ttl) {
            resolve(undefined);
          } else {
            resolve(entry.data);
          }
        };
      });
    } catch { return undefined; }
  }

  async set(key: string, data: T): Promise<void> {
    try {
      const db = await this.getDB();
      const entry: IDBEntry<T> = { key, data, timestamp: Date.now(), version: this.version };
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const request = tx.objectStore(this.storeName).put(entry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch { /* ignore IndexedDB errors */ }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const request = tx.objectStore(this.storeName).clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch { /* ignore IndexedDB errors */ }
  }

  close(): void {
    if (this.db) { this.db.close(); this.db = null; this.dbPromise = null; }
  }
}

// ============================================================================
// DEBOUNCED SEARCH
// ============================================================================

export function createDebouncedSearch<T>(
  data: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs = 150
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastQuery = '';
  let cachedResults: T[] = [];

  return {
    search: (query: string): Promise<T[]> => new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (query === lastQuery) { resolve(cachedResults); return; }
      timeoutId = setTimeout(() => {
        cachedResults = data.filter(item => searchFn(item, query));
        lastQuery = query;
        resolve(cachedResults);
      }, debounceMs);
    }),
    clearCache: () => { lastQuery = ''; cachedResults = []; },
  };
}

// Export default instances
export const lruCache = new LRUCache();
export const idbCache = new IndexedDBCache();
