/**
 * Search Service
 * Provides centralized search functionality across all content types
 * Implements case-insensitive matching with language support
 * Supports advanced search syntax: id:123, pow>500, tec:300-400, key:unique-key, date:2024-01
 */

import { contentLoader } from '@/content/loader';
import type { Character, Swimsuit, Event, Gacha, Guide, Item, Episode } from '@/content/schemas/content.schema';
import type { LocalizedString, LanguageCode } from '@/shared/types/localization';

// ============================================================================
// Advanced Search Types and Parser
// ============================================================================

export type AdvancedQueryType = 'id' | 'stats' | 'unique_key' | 'date' | 'text';
export type StatsOperator = '=' | '>' | '<' | '>=' | '<=' | 'range';
export type StatsField = 'pow' | 'tec' | 'stm' | 'apl';

export interface AdvancedSearchQuery {
  type: AdvancedQueryType;
  field?: StatsField;
  operator?: StatsOperator;
  value: string | number | [number, number];
  raw: string;
}

export interface AdvancedSearchParseResult {
  queries: AdvancedSearchQuery[];
  textQuery: string;
  errors: string[];
}

// Regex patterns for advanced search syntax
const ADVANCED_PATTERNS = {
  id: /^id:(\d+)$/i,
  uniqueKey: /^key:([a-z0-9_-]+)$/i,
  statsComparison: /^(pow|tec|stm|apl)([><=]+)(\d+)$/i,
  statsRange: /^(pow|tec|stm|apl):(\d+)-(\d+)$/i,
  date: /^date:(\d{4}(?:-\d{2})?(?:-\d{2})?)$/i,
};

/**
 * Parse a query string to detect advanced search syntax
 * Returns structured queries and remaining text query
 */
export function parseAdvancedQuery(query: string): AdvancedSearchParseResult {
  const result: AdvancedSearchParseResult = {
    queries: [],
    textQuery: '',
    errors: [],
  };

  if (!query || !query.trim()) {
    return result;
  }

  const tokens = query.trim().split(/\s+/);
  const textTokens: string[] = [];

  for (const token of tokens) {
    const parsed = parseToken(token);
    if (parsed.query) {
      result.queries.push(parsed.query);
    } else if (parsed.error) {
      result.errors.push(parsed.error);
      // Fall back to text search for invalid syntax
      textTokens.push(token);
    } else {
      textTokens.push(token);
    }
  }

  result.textQuery = textTokens.join(' ');
  return result;
}

/**
 * Parse a single token for advanced search syntax
 */
function parseToken(token: string): { query?: AdvancedSearchQuery; error?: string } {
  // Check for ID pattern: id:123
  const idMatch = token.match(ADVANCED_PATTERNS.id);
  if (idMatch) {
    return {
      query: {
        type: 'id',
        value: parseInt(idMatch[1], 10),
        raw: token,
      },
    };
  }

  // Check for unique_key pattern: key:some-key
  const keyMatch = token.match(ADVANCED_PATTERNS.uniqueKey);
  if (keyMatch) {
    return {
      query: {
        type: 'unique_key',
        value: keyMatch[1],
        raw: token,
      },
    };
  }

  // Check for stats range pattern: pow:300-400
  const rangeMatch = token.match(ADVANCED_PATTERNS.statsRange);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[2], 10);
    const max = parseInt(rangeMatch[3], 10);
    if (min > max) {
      return { error: `Invalid range in "${token}": min (${min}) > max (${max})` };
    }
    return {
      query: {
        type: 'stats',
        field: rangeMatch[1].toLowerCase() as StatsField,
        operator: 'range',
        value: [min, max],
        raw: token,
      },
    };
  }

  // Check for stats comparison pattern: pow>500, tec<=300
  const compMatch = token.match(ADVANCED_PATTERNS.statsComparison);
  if (compMatch) {
    const operator = compMatch[2] as StatsOperator;
    if (!['>', '<', '>=', '<=', '='].includes(operator)) {
      return { error: `Invalid operator "${operator}" in "${token}"` };
    }
    return {
      query: {
        type: 'stats',
        field: compMatch[1].toLowerCase() as StatsField,
        operator,
        value: parseInt(compMatch[3], 10),
        raw: token,
      },
    };
  }

  // Check for date pattern: date:2024-01 or date:2024-01-15
  const dateMatch = token.match(ADVANCED_PATTERNS.date);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    // Validate date format
    if (!isValidDateFormat(dateStr)) {
      return { error: `Invalid date format in "${token}". Use YYYY, YYYY-MM, or YYYY-MM-DD` };
    }
    return {
      query: {
        type: 'date',
        value: dateStr,
        raw: token,
      },
    };
  }

  // Check for partial advanced syntax that might be malformed
  if (token.includes(':') && (token.startsWith('id:') || token.startsWith('key:') || token.startsWith('date:'))) {
    return { error: `Invalid syntax: "${token}"` };
  }

  // Not an advanced query token - treat as regular text
  return {};
}

/**
 * Validate date format string
 */
function isValidDateFormat(dateStr: string): boolean {
  const parts = dateStr.split('-');
  if (parts.length < 1 || parts.length > 3) return false;
  
  const year = parseInt(parts[0], 10);
  if (isNaN(year) || year < 2000 || year > 2100) return false;
  
  if (parts.length >= 2) {
    const month = parseInt(parts[1], 10);
    if (isNaN(month) || month < 1 || month > 12) return false;
  }
  
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    if (isNaN(day) || day < 1 || day > 31) return false;
  }
  
  return true;
}

/**
 * Check if a stats value satisfies the query condition
 */
function matchesStatsQuery(
  stats: { POW: number; TEC: number; STM: number; APL?: number } | undefined,
  query: AdvancedSearchQuery
): boolean {
  if (!stats || query.type !== 'stats' || !query.field) return false;

  const fieldMap: Record<StatsField, keyof typeof stats> = {
    pow: 'POW',
    tec: 'TEC',
    stm: 'STM',
    apl: 'APL',
  };

  const statValue = stats[fieldMap[query.field]];
  if (statValue === undefined) return false;

  if (query.operator === 'range' && Array.isArray(query.value)) {
    const [min, max] = query.value;
    return statValue >= min && statValue <= max;
  }

  const targetValue = query.value as number;
  switch (query.operator) {
    case '>': return statValue > targetValue;
    case '<': return statValue < targetValue;
    case '>=': return statValue >= targetValue;
    case '<=': return statValue <= targetValue;
    case '=': return statValue === targetValue;
    default: return false;
  }
}

/**
 * Check if a date falls within the query date range
 */
function matchesDateQuery(
  startDate: Date | string | undefined,
  endDate: Date | string | undefined,
  query: AdvancedSearchQuery
): boolean {
  if (query.type !== 'date') return false;
  
  const dateStr = query.value as string;
  const parts = dateStr.split('-');
  
  // Parse query date range
  const queryYear = parseInt(parts[0], 10);
  const queryMonth = parts.length >= 2 ? parseInt(parts[1], 10) : undefined;
  const queryDay = parts.length === 3 ? parseInt(parts[2], 10) : undefined;

  // Calculate query date range
  let queryStart: Date;
  let queryEnd: Date;

  if (queryDay !== undefined && queryMonth !== undefined) {
    // Specific day: date:2024-01-15
    queryStart = new Date(queryYear, queryMonth - 1, queryDay, 0, 0, 0);
    queryEnd = new Date(queryYear, queryMonth - 1, queryDay, 23, 59, 59);
  } else if (queryMonth !== undefined) {
    // Specific month: date:2024-01
    queryStart = new Date(queryYear, queryMonth - 1, 1);
    queryEnd = new Date(queryYear, queryMonth, 0, 23, 59, 59); // Last day of month
  } else {
    // Specific year: date:2024
    queryStart = new Date(queryYear, 0, 1);
    queryEnd = new Date(queryYear, 11, 31, 23, 59, 59);
  }

  // Parse item dates
  const itemStart = startDate ? new Date(startDate) : undefined;
  const itemEnd = endDate ? new Date(endDate) : undefined;

  // Check if item date range overlaps with query date range
  if (itemStart && itemEnd) {
    return itemStart <= queryEnd && itemEnd >= queryStart;
  } else if (itemStart) {
    return itemStart >= queryStart && itemStart <= queryEnd;
  } else if (itemEnd) {
    return itemEnd >= queryStart && itemEnd <= queryEnd;
  }

  return false;
}

export interface SearchResult {
  type: 'character' | 'swimsuit' | 'event' | 'gacha' | 'guide' | 'item' | 'episode';
  id: number;
  unique_key: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  url: string;
}

export interface SearchResults {
  characters: SearchResult[];
  swimsuits: SearchResult[];
  events: SearchResult[];
  gachas: SearchResult[];
  guides: SearchResult[];
  items: SearchResult[];
  episodes: SearchResult[];
  total: number;
}

export interface AdvancedSearchResults extends SearchResults {
  parsedQueries: AdvancedSearchQuery[];
  errors: string[];
}

export interface SearchOptions {
  maxPerType?: number;
  language?: LanguageCode;
  enableAdvancedSearch?: boolean;
}

const DEFAULT_MAX_PER_TYPE = 5;
const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * Get localized value from a LocalizedString object
 */
function getLocalizedValue(localized: LocalizedString | undefined, language: LanguageCode): string {
  if (!localized) return '';
  return localized[language] || localized.en || localized.jp || '';
}

/**
 * Check if a string matches the query (case-insensitive)
 */
function matchesQuery(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query.toLowerCase());
}

/**
 * Check if a LocalizedString matches the query in the specified language
 */
function matchesLocalizedQuery(
  localized: LocalizedString | undefined,
  query: string,
  language: LanguageCode
): boolean {
  if (!localized) return false;
  const value = getLocalizedValue(localized, language);
  return matchesQuery(value, query);
}

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }


  /**
   * Search across all content types
   * Returns results grouped by type with configurable limits
   * Supports advanced search syntax when enableAdvancedSearch is true
   */
  search(query: string, options: SearchOptions = {}): SearchResults | AdvancedSearchResults {
    const { 
      maxPerType = DEFAULT_MAX_PER_TYPE, 
      language = DEFAULT_LANGUAGE,
      enableAdvancedSearch = true 
    } = options;

    // Return empty results for empty or whitespace-only queries
    if (!query || !query.trim()) {
      return this.createEmptyResults();
    }

    const trimmedQuery = query.trim();

    // Parse advanced search syntax if enabled
    if (enableAdvancedSearch) {
      const parseResult = parseAdvancedQuery(trimmedQuery);
      
      // If we have advanced queries, use advanced search
      if (parseResult.queries.length > 0) {
        return this.advancedSearch(parseResult, maxPerType, language);
      }
    }

    // Standard text search
    return {
      characters: this.searchCharacters(trimmedQuery, maxPerType, language),
      swimsuits: this.searchSwimsuits(trimmedQuery, maxPerType, language),
      events: this.searchEvents(trimmedQuery, maxPerType, language),
      gachas: this.searchGachas(trimmedQuery, maxPerType, language),
      guides: this.searchGuides(trimmedQuery, maxPerType, language),
      items: this.searchItems(trimmedQuery, maxPerType, language),
      episodes: this.searchEpisodes(trimmedQuery, maxPerType, language),
      get total() {
        return (
          this.characters.length +
          this.swimsuits.length +
          this.events.length +
          this.gachas.length +
          this.guides.length +
          this.items.length +
          this.episodes.length
        );
      },
    };
  }

  /**
   * Advanced search with structured queries
   * Supports ID, stats, unique_key, and date filtering
   */
  private advancedSearch(
    parseResult: AdvancedSearchParseResult,
    maxPerType: number,
    language: LanguageCode
  ): AdvancedSearchResults {
    const { queries, textQuery, errors } = parseResult;

    // Start with all items or text-filtered items
    let characters = contentLoader.getCharacters();
    let swimsuits = contentLoader.getSwimsuits();
    let events = contentLoader.getEvents();
    let gachas = contentLoader.getGachas();
    let guides = contentLoader.getGuides();
    let items = contentLoader.getItems();
    let episodes = contentLoader.getEpisodes();

    // Apply text filter if present
    if (textQuery) {
      characters = characters.filter(c => 
        matchesLocalizedQuery(c.name, textQuery, language) || matchesQuery(c.title, textQuery)
      );
      swimsuits = swimsuits.filter(s => 
        matchesLocalizedQuery(s.name, textQuery, language) || matchesQuery(s.title, textQuery) || matchesQuery(s.character, textQuery)
      );
      events = events.filter(e => 
        matchesLocalizedQuery(e.name, textQuery, language) || matchesQuery(e.title, textQuery)
      );
      gachas = gachas.filter(g => matchesLocalizedQuery(g.name, textQuery, language));
      guides = guides.filter(g => 
        matchesLocalizedQuery(g.localizedTitle, textQuery, language) || matchesQuery(g.title, textQuery)
      );
      items = items.filter(i => 
        matchesLocalizedQuery(i.name, textQuery, language) || matchesQuery(i.title, textQuery)
      );
      episodes = episodes.filter(e => 
        matchesLocalizedQuery(e.name, textQuery, language) || matchesQuery(e.title, textQuery)
      );
    }

    // Apply advanced filters
    for (const query of queries) {
      switch (query.type) {
        case 'id':
          characters = characters.filter(c => c.id === query.value);
          swimsuits = swimsuits.filter(s => s.id === query.value);
          events = events.filter(e => e.id === query.value);
          gachas = gachas.filter(g => g.id === query.value);
          guides = guides.filter(g => g.id === query.value);
          items = items.filter(i => i.id === query.value);
          episodes = episodes.filter(e => e.id === query.value);
          break;

        case 'unique_key':
          characters = characters.filter(c => c.unique_key === query.value);
          swimsuits = swimsuits.filter(s => s.unique_key === query.value);
          events = events.filter(e => e.unique_key === query.value);
          gachas = gachas.filter(g => g.unique_key === query.value);
          guides = guides.filter(g => g.unique_key === query.value);
          items = items.filter(i => i.unique_key === query.value);
          episodes = episodes.filter(e => e.unique_key === query.value);
          break;

        case 'stats':
          // Stats only apply to characters and swimsuits
          characters = characters.filter(c => matchesStatsQuery(c.stats, query));
          swimsuits = swimsuits.filter(s => matchesStatsQuery(s.stats, query));
          // Clear other types as they don't have stats
          events = [];
          gachas = [];
          guides = [];
          items = [];
          episodes = [];
          break;

        case 'date':
          // Date only applies to events and gachas
          events = events.filter(e => matchesDateQuery(e.start_date, e.end_date, query));
          gachas = gachas.filter(g => matchesDateQuery(g.start_date, g.end_date, query));
          // Clear other types as they don't have date ranges
          characters = [];
          swimsuits = [];
          guides = [];
          items = [];
          episodes = [];
          break;
      }
    }

    // Transform and limit results
    const result: AdvancedSearchResults = {
      characters: characters.slice(0, maxPerType).map(c => this.transformCharacter(c, language)),
      swimsuits: swimsuits.slice(0, maxPerType).map(s => this.transformSwimsuit(s, language)),
      events: events.slice(0, maxPerType).map(e => this.transformEvent(e, language)),
      gachas: gachas.slice(0, maxPerType).map(g => this.transformGacha(g, language)),
      guides: guides.slice(0, maxPerType).map(g => this.transformGuide(g, language)),
      items: items.slice(0, maxPerType).map(i => this.transformItem(i, language)),
      episodes: episodes.slice(0, maxPerType).map(e => this.transformEpisode(e, language)),
      parsedQueries: queries,
      errors,
      get total() {
        return (
          this.characters.length +
          this.swimsuits.length +
          this.events.length +
          this.gachas.length +
          this.guides.length +
          this.items.length +
          this.episodes.length
        );
      },
    };

    return result;
  }

  private createEmptyResults(): SearchResults {
    return {
      characters: [],
      swimsuits: [],
      events: [],
      gachas: [],
      guides: [],
      items: [],
      episodes: [],
      total: 0,
    };
  }

  /**
   * Search characters by name
   */
  private searchCharacters(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const characters = contentLoader.getCharacters();
    const matches = characters.filter((char) =>
      matchesLocalizedQuery(char.name, query, language) ||
      matchesQuery(char.title, query)
    );

    return matches.slice(0, maxResults).map((char) => this.transformCharacter(char, language));
  }

  /**
   * Search swimsuits by name
   */
  private searchSwimsuits(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const swimsuits = contentLoader.getSwimsuits();
    const matches = swimsuits.filter((suit) =>
      matchesLocalizedQuery(suit.name, query, language) ||
      matchesQuery(suit.title, query) ||
      matchesQuery(suit.character, query)
    );

    return matches.slice(0, maxResults).map((suit) => this.transformSwimsuit(suit, language));
  }

  /**
   * Search events by name
   */
  private searchEvents(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const events = contentLoader.getEvents();
    const matches = events.filter((event) =>
      matchesLocalizedQuery(event.name, query, language) ||
      matchesQuery(event.title, query)
    );

    return matches.slice(0, maxResults).map((event) => this.transformEvent(event, language));
  }

  /**
   * Search gachas by name
   */
  private searchGachas(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const gachas = contentLoader.getGachas();
    const matches = gachas.filter((gacha) =>
      matchesLocalizedQuery(gacha.name, query, language)
    );

    return matches.slice(0, maxResults).map((gacha) => this.transformGacha(gacha, language));
  }

  /**
   * Search guides by title
   */
  private searchGuides(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const guides = contentLoader.getGuides();
    const matches = guides.filter((guide) =>
      matchesLocalizedQuery(guide.localizedTitle, query, language) ||
      matchesQuery(guide.title, query)
    );

    return matches.slice(0, maxResults).map((guide) => this.transformGuide(guide, language));
  }

  /**
   * Search items by name
   */
  private searchItems(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const items = contentLoader.getItems();
    const matches = items.filter((item) =>
      matchesLocalizedQuery(item.name, query, language) ||
      matchesQuery(item.title, query)
    );

    return matches.slice(0, maxResults).map((item) => this.transformItem(item, language));
  }

  /**
   * Search episodes by name
   */
  private searchEpisodes(query: string, maxResults: number, language: LanguageCode): SearchResult[] {
    const episodes = contentLoader.getEpisodes();
    const matches = episodes.filter((episode) =>
      matchesLocalizedQuery(episode.name, query, language) ||
      matchesQuery(episode.title, query)
    );

    return matches.slice(0, maxResults).map((episode) => this.transformEpisode(episode, language));
  }

  /**
   * Transform Character to SearchResult
   * Displays: image, name
   */
  private transformCharacter(char: Character, language: LanguageCode): SearchResult {
    return {
      type: 'character',
      id: char.id,
      unique_key: char.unique_key,
      title: getLocalizedValue(char.name, language),
      image: char.image,
      url: `/girls/${char.unique_key}`,
    };
  }

  /**
   * Transform Swimsuit to SearchResult
   * Displays: image, name, rarity, character name
   */
  private transformSwimsuit(suit: Swimsuit, language: LanguageCode): SearchResult {
    return {
      type: 'swimsuit',
      id: suit.id,
      unique_key: suit.unique_key,
      title: getLocalizedValue(suit.name, language),
      subtitle: suit.character,
      image: suit.image,
      badge: suit.rarity,
      badgeVariant: this.getRarityBadgeVariant(suit.rarity),
      url: `/swimsuits/${suit.unique_key}`,
    };
  }

  /**
   * Transform Event to SearchResult
   * Displays: image, name, type, status
   */
  private transformEvent(event: Event, language: LanguageCode): SearchResult {
    return {
      type: 'event',
      id: event.id,
      unique_key: event.unique_key,
      title: getLocalizedValue(event.name, language),
      subtitle: event.type,
      image: event.image,
      badge: event.event_status,
      badgeVariant: this.getEventStatusBadgeVariant(event.event_status),
      url: `/events/${event.unique_key}`,
    };
  }

  /**
   * Transform Gacha to SearchResult
   * Displays: image, name, status
   */
  private transformGacha(gacha: Gacha, language: LanguageCode): SearchResult {
    return {
      type: 'gacha',
      id: gacha.id,
      unique_key: gacha.unique_key,
      title: getLocalizedValue(gacha.name, language),
      image: gacha.image,
      badge: gacha.gacha_status,
      badgeVariant: this.getGachaStatusBadgeVariant(gacha.gacha_status),
      url: `/gachas/${gacha.unique_key}`,
    };
  }

  /**
   * Transform Guide to SearchResult
   * Displays: image, title, difficulty, read time
   */
  private transformGuide(guide: Guide, language: LanguageCode): SearchResult {
    return {
      type: 'guide',
      id: guide.id,
      unique_key: guide.unique_key,
      title: getLocalizedValue(guide.localizedTitle, language),
      subtitle: `${guide.difficulty} • ${guide.read_time}`,
      image: guide.image,
      badge: guide.difficulty,
      badgeVariant: this.getDifficultyBadgeVariant(guide.difficulty),
      url: `/guides/${guide.unique_key}`,
    };
  }

  /**
   * Transform Item to SearchResult
   * Displays: image, name, type, rarity
   */
  private transformItem(item: Item, language: LanguageCode): SearchResult {
    return {
      type: 'item',
      id: item.id,
      unique_key: item.unique_key,
      title: getLocalizedValue(item.name, language),
      subtitle: item.type,
      image: item.image,
      badge: item.rarity,
      badgeVariant: this.getItemRarityBadgeVariant(item.rarity),
      url: `/items/${item.unique_key}`,
    };
  }

  /**
   * Transform Episode to SearchResult
   * Displays: image, name, type, status
   */
  private transformEpisode(episode: Episode, language: LanguageCode): SearchResult {
    return {
      type: 'episode',
      id: episode.id,
      unique_key: episode.unique_key,
      title: getLocalizedValue(episode.name, language),
      subtitle: episode.type,
      image: episode.image,
      badge: episode.episode_status,
      badgeVariant: this.getEpisodeStatusBadgeVariant(episode.episode_status),
      url: `/episodes/${episode.unique_key}`,
    };
  }

  /**
   * Get badge variant for character/swimsuit rarity
   */
  private getRarityBadgeVariant(rarity: 'SSR' | 'SR' | 'R'): 'default' | 'secondary' | 'outline' {
    switch (rarity) {
      case 'SSR':
        return 'default';
      case 'SR':
        return 'secondary';
      case 'R':
        return 'outline';
    }
  }

  /**
   * Get badge variant for item rarity
   */
  private getItemRarityBadgeVariant(rarity: 'SSR' | 'SR' | 'R' | 'N'): 'default' | 'secondary' | 'outline' {
    switch (rarity) {
      case 'SSR':
        return 'default';
      case 'SR':
        return 'secondary';
      case 'R':
      case 'N':
        return 'outline';
    }
  }

  /**
   * Get badge variant for event status
   */
  private getEventStatusBadgeVariant(status: 'Active' | 'Upcoming' | 'Ended'): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Upcoming':
        return 'secondary';
      case 'Ended':
        return 'destructive';
    }
  }

  /**
   * Get badge variant for gacha status
   */
  private getGachaStatusBadgeVariant(status: 'Active' | 'Coming Soon' | 'Ended'): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Coming Soon':
        return 'secondary';
      case 'Ended':
        return 'destructive';
    }
  }

  /**
   * Get badge variant for guide difficulty
   */
  private getDifficultyBadgeVariant(difficulty: 'Easy' | 'Medium' | 'Hard'): 'default' | 'secondary' | 'destructive' {
    switch (difficulty) {
      case 'Easy':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'Hard':
        return 'destructive';
    }
  }

  /**
   * Get badge variant for episode status
   */
  private getEpisodeStatusBadgeVariant(status: 'Available' | 'Coming Soon' | 'Limited'): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'Available':
        return 'default';
      case 'Coming Soon':
        return 'secondary';
      case 'Limited':
        return 'destructive';
    }
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();
