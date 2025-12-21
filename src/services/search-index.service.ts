/**
 * Search Index Service
 * High-performance search using FlexSearch with pre-built indexes
 * Optimized for datasets with 10,000+ items
 */

import FlexSearch from 'flexsearch';
import { contentLoader } from '@/content/loader';
import type { 
  Character, 
  Swimsuit, 
  Event, 
  Gacha, 
  Guide, 
  Item, 
  Episode 
} from '@/content/schemas/content.schema';
import type { LanguageCode } from '@/shared/types/localization';

// Type definitions for FlexSearch
// FlexSearch has complex generics, using 'any' for index storage type
type DocumentIndex = any;

// Type definitions for FlexSearch results
interface FlexSearchResult {
  id: number;
  doc: unknown;
}

interface FlexSearchFieldResult {
  field: string;
  result: FlexSearchResult[];
}

export interface IndexedSearchResult {
  type: 'character' | 'swimsuit' | 'event' | 'gacha' | 'guide' | 'item' | 'episode';
  id: number;
  unique_key: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  url: string;
  // Original data for additional processing
  _original: unknown;
}

export interface IndexedSearchResults {
  results: IndexedSearchResult[];
  total: number;
  hasMore: boolean;
  searchTime: number;
}

export interface SearchIndexOptions {
  limit?: number;
  offset?: number;
  types?: Array<IndexedSearchResult['type']>;
  language?: LanguageCode;
}

const DEFAULT_LIMIT = 24;
const ALL_TYPES: Array<IndexedSearchResult['type']> = [
  'character', 'swimsuit', 'event', 'gacha', 'guide', 'item', 'episode'
];

/**
 * SearchIndexService - Singleton for fast indexed search
 * Uses FlexSearch for O(1) search performance
 */
export class SearchIndexService {
  private static instance: SearchIndexService;
  
  // FlexSearch indexes for each content type
  private characterIndex: DocumentIndex = null;
  private swimsuitIndex: DocumentIndex = null;
  private eventIndex: DocumentIndex = null;
  private gachaIndex: DocumentIndex = null;
  private guideIndex: DocumentIndex = null;
  private itemIndex: DocumentIndex = null;
  private episodeIndex: DocumentIndex = null;
  
  private indexBuilt = false;
  private buildPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SearchIndexService {
    if (!SearchIndexService.instance) {
      SearchIndexService.instance = new SearchIndexService();
    }
    return SearchIndexService.instance;
  }

  /**
   * Check if indexes are built
   */
  isReady(): boolean {
    return this.indexBuilt;
  }

  /**
   * Build all search indexes
   * Lazily loads content if not already loaded
   */
  async buildIndexes(): Promise<void> {
    if (this.indexBuilt) return;
    
    // Deduplicate concurrent build requests
    if (this.buildPromise) {
      return this.buildPromise;
    }

    this.buildPromise = this._buildIndexesInternal();
    await this.buildPromise;
    this.buildPromise = null;
  }

  private async _buildIndexesInternal(): Promise<void> {
    // Load all content types needed for search indexes
    await Promise.all([
      contentLoader.loadCharacters(),
      contentLoader.loadSwimsuits(),
      contentLoader.loadEvents(),
      contentLoader.loadGachas(),
      contentLoader.loadGuides(),
      contentLoader.loadItems(),
      contentLoader.loadEpisodes(),
    ]);
    
    // Build all indexes in parallel
    await Promise.all([
      this.buildCharacterIndex(),
      this.buildSwimsuitIndex(),
      this.buildEventIndex(),
      this.buildGachaIndex(),
      this.buildGuideIndex(),
      this.buildItemIndex(),
      this.buildEpisodeIndex(),
    ]);

    this.indexBuilt = true;
  }

  /** Create a FlexSearch document index with standard config */
  private createIndex(indexFields: string[]): DocumentIndex {
    return new FlexSearch.Document({
      document: { id: 'id', index: indexFields, store: true },
      tokenize: 'forward',
      cache: 100,
      resolution: 9,
    });
  }

  /** Generic index builder */
  private buildIndex<T extends { name?: { en?: string; jp?: string } }>(
    items: T[],
    indexFields: string[],
    docTransform?: (item: T) => Record<string, unknown>
  ): DocumentIndex {
    const index = this.createIndex(indexFields);
    for (const item of items) {
      const doc = docTransform ? docTransform(item) : {
        ...item,
        name_en: item.name?.en || '',
        name_jp: item.name?.jp || '',
      };
      index.add(doc);
    }
    return index;
  }

  private async buildCharacterIndex(): Promise<void> {
    this.characterIndex = this.buildIndex(contentLoader.getCharacters(), ['title', 'name_en', 'name_jp']);
  }

  private async buildSwimsuitIndex(): Promise<void> {
    this.swimsuitIndex = this.buildIndex(contentLoader.getSwimsuits(), ['title', 'name_en', 'name_jp', 'character']);
  }

  private async buildEventIndex(): Promise<void> {
    this.eventIndex = this.buildIndex(contentLoader.getEvents(), ['title', 'name_en', 'name_jp']);
  }

  private async buildGachaIndex(): Promise<void> {
    this.gachaIndex = this.buildIndex(contentLoader.getGachas(), ['name_en', 'name_jp']);
  }

  private async buildGuideIndex(): Promise<void> {
    this.guideIndex = this.buildIndex(contentLoader.getGuides(), ['title', 'localizedTitle_en', 'localizedTitle_jp', 'summary'],
      (g) => ({ ...g, localizedTitle_en: g.localizedTitle?.en || '', localizedTitle_jp: g.localizedTitle?.jp || '' }));
  }

  private async buildItemIndex(): Promise<void> {
    this.itemIndex = this.buildIndex(contentLoader.getItems(), ['title', 'name_en', 'name_jp']);
  }

  private async buildEpisodeIndex(): Promise<void> {
    this.episodeIndex = this.buildIndex(contentLoader.getEpisodes(), ['title', 'name_en', 'name_jp']);
  }

  /**
   * Search across all content types with pagination
   */
  search(query: string, options: SearchIndexOptions = {}): IndexedSearchResults {
    const startTime = performance.now();
    const { 
      limit = DEFAULT_LIMIT, 
      offset = 0, 
      types = ALL_TYPES,
      language = 'en' 
    } = options;

    if (!query || !query.trim() || !this.indexBuilt) {
      return {
        results: [],
        total: 0,
        hasMore: false,
        searchTime: 0,
      };
    }

    const trimmedQuery = query.trim();
    const allResults: IndexedSearchResult[] = [];

    // Search each type and collect results
    if (types.includes('character') && this.characterIndex) {
      const results = this.searchIndex(this.characterIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformCharacter(r as Character, language)));
    }

    if (types.includes('swimsuit') && this.swimsuitIndex) {
      const results = this.searchIndex(this.swimsuitIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformSwimsuit(r as Swimsuit, language)));
    }

    if (types.includes('event') && this.eventIndex) {
      const results = this.searchIndex(this.eventIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformEvent(r as Event, language)));
    }

    if (types.includes('gacha') && this.gachaIndex) {
      const results = this.searchIndex(this.gachaIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformGacha(r as Gacha, language)));
    }

    if (types.includes('guide') && this.guideIndex) {
      const results = this.searchIndex(this.guideIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformGuide(r as Guide, language)));
    }

    if (types.includes('item') && this.itemIndex) {
      const results = this.searchIndex(this.itemIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformItem(r as Item, language)));
    }

    if (types.includes('episode') && this.episodeIndex) {
      const results = this.searchIndex(this.episodeIndex, trimmedQuery);
      allResults.push(...results.map(r => this.transformEpisode(r as Episode, language)));
    }

    const total = allResults.length;
    const paginatedResults = allResults.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total,
      hasMore: offset + limit < total,
      searchTime: performance.now() - startTime,
    };
  }

  /**
   * Search a single index and return stored documents
   */
  private searchIndex<T>(
    index: DocumentIndex,
    query: string,
    limit = 1000
  ): T[] {
    if (!index) return [];
    
    const searchResults = index.search(query, { 
      limit,
      enrich: true,
    }) as FlexSearchFieldResult[];

    // Deduplicate results by ID (same doc might match multiple fields)
    const seen = new Set<number>();
    const docs: T[] = [];

    for (const fieldResult of searchResults) {
      for (const item of fieldResult.result) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          docs.push(item.doc as T);
        }
      }
    }

    return docs;
  }

  /**
   * Get counts by type for filter chips
   */
  getTypeCounts(query: string): Record<IndexedSearchResult['type'] | 'all', number> {
    if (!query || !query.trim() || !this.indexBuilt) {
      return { all: 0, character: 0, swimsuit: 0, event: 0, gacha: 0, guide: 0, item: 0, episode: 0 };
    }

    const trimmedQuery = query.trim();
    const counts: Record<string, number> = { all: 0 };

    for (const type of ALL_TYPES) {
      const typeResults = this.search(trimmedQuery, { types: [type], limit: 10000 });
      counts[type] = typeResults.total;
      counts.all += typeResults.total;
    }

    return counts as Record<IndexedSearchResult['type'] | 'all', number>;
  }

  // Transform functions
  private getLocalizedValue(localized: { en?: string; jp?: string } | undefined, language: LanguageCode): string {
    if (!localized) return '';
    return localized[language] || localized.en || localized.jp || '';
  }

  private transformCharacter(char: Character, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'character',
      id: char.id,
      unique_key: char.unique_key,
      title: this.getLocalizedValue(char.name, language) || char.title,
      image: char.image,
      url: `/girls/${char.unique_key}`,
      _original: char,
    };
  }

  private transformSwimsuit(suit: Swimsuit, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'swimsuit',
      id: suit.id,
      unique_key: suit.unique_key,
      title: this.getLocalizedValue(suit.name, language) || suit.title,
      subtitle: suit.character,
      image: suit.image,
      badge: suit.rarity,
      badgeVariant: this.getRarityBadgeVariant(suit.rarity),
      url: `/swimsuits/${suit.unique_key}`,
      _original: suit,
    };
  }

  private transformEvent(event: Event, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'event',
      id: event.id,
      unique_key: event.unique_key,
      title: this.getLocalizedValue(event.name, language) || event.title,
      subtitle: event.type,
      image: event.image,
      badge: event.event_status,
      badgeVariant: this.getEventStatusBadgeVariant(event.event_status),
      url: `/events/${event.unique_key}`,
      _original: event,
    };
  }

  private transformGacha(gacha: Gacha, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'gacha',
      id: gacha.id,
      unique_key: gacha.unique_key,
      title: this.getLocalizedValue(gacha.name, language),
      image: gacha.image,
      badge: gacha.gacha_status,
      badgeVariant: this.getGachaStatusBadgeVariant(gacha.gacha_status),
      url: `/gachas/${gacha.unique_key}`,
      _original: gacha,
    };
  }

  private transformGuide(guide: Guide, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'guide',
      id: guide.id,
      unique_key: guide.unique_key,
      title: this.getLocalizedValue(guide.localizedTitle, language) || guide.title,
      subtitle: `${guide.difficulty} • ${guide.read_time}`,
      image: guide.image,
      badge: guide.difficulty,
      badgeVariant: this.getDifficultyBadgeVariant(guide.difficulty),
      url: `/guides/${guide.unique_key}`,
      _original: guide,
    };
  }

  private transformItem(item: Item, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'item',
      id: item.id,
      unique_key: item.unique_key,
      title: this.getLocalizedValue(item.name, language) || item.title,
      subtitle: item.type,
      image: item.image,
      badge: item.rarity,
      badgeVariant: this.getItemRarityBadgeVariant(item.rarity),
      url: `/items/${item.unique_key}`,
      _original: item,
    };
  }

  private transformEpisode(episode: Episode, language: LanguageCode): IndexedSearchResult {
    return {
      type: 'episode',
      id: episode.id,
      unique_key: episode.unique_key,
      title: this.getLocalizedValue(episode.name, language) || episode.title,
      subtitle: episode.type,
      image: episode.image,
      badge: episode.episode_status,
      badgeVariant: this.getEpisodeStatusBadgeVariant(episode.episode_status),
      url: `/episodes/${episode.unique_key}`,
      _original: episode,
    };
  }

  // Badge variant mappings
  private static readonly BADGE_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    SSR: 'default', SR: 'secondary', R: 'outline', N: 'outline',
    Active: 'default', Available: 'default', Easy: 'default',
    Upcoming: 'secondary', 'Coming Soon': 'secondary', Medium: 'secondary',
    Ended: 'destructive', Limited: 'destructive', Hard: 'destructive',
  };

  private getBadge(value: string, fallback: 'outline' | 'destructive' = 'outline') {
    return SearchIndexService.BADGE_MAP[value] || fallback;
  }

  private getRarityBadgeVariant(r: string) { return this.getBadge(r) as 'default' | 'secondary' | 'outline'; }
  private getItemRarityBadgeVariant(r: string) { return this.getBadge(r) as 'default' | 'secondary' | 'outline'; }
  private getEventStatusBadgeVariant(s: string) { return this.getBadge(s, 'destructive') as 'default' | 'secondary' | 'destructive'; }
  private getGachaStatusBadgeVariant(s: string) { return this.getBadge(s, 'destructive') as 'default' | 'secondary' | 'destructive'; }
  private getDifficultyBadgeVariant(d: string) { return this.getBadge(d, 'destructive') as 'default' | 'secondary' | 'destructive'; }
  private getEpisodeStatusBadgeVariant(s: string) { return this.getBadge(s, 'destructive') as 'default' | 'secondary' | 'destructive'; }

  /**
   * Clear indexes and allow rebuild
   */
  clearIndexes(): void {
    this.characterIndex = null;
    this.swimsuitIndex = null;
    this.eventIndex = null;
    this.gachaIndex = null;
    this.guideIndex = null;
    this.itemIndex = null;
    this.episodeIndex = null;
    this.indexBuilt = false;
    this.buildPromise = null;
  }
}

// Export singleton
export const searchIndexService = SearchIndexService.getInstance();

