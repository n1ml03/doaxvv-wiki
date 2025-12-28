import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../../src/services/search.service';
import { contentLoader } from '../../src/content/loader';
import type { Character, Guide, Event } from '../../src/content/schemas/content.schema';
import type { LocalizedString } from '../../src/shared/types/localization';

// Mock the content loader
vi.mock('../../src/content/loader', () => ({
  contentLoader: {
    getCharacters: vi.fn(),
    getSwimsuits: vi.fn(),
    getEvents: vi.fn(),
    getGachas: vi.fn(),
    getGuides: vi.fn(),
    getItems: vi.fn(),
    getEpisodes: vi.fn(),
    getTools: vi.fn(),
    getAccessories: vi.fn(),
    getMissions: vi.fn(),
    getQuizzes: vi.fn(),
  },
}));

// Helper to set up default empty mocks for all content types
function setupEmptyMocks() {
  vi.mocked(contentLoader.getCharacters).mockReturnValue([]);
  vi.mocked(contentLoader.getSwimsuits).mockReturnValue([]);
  vi.mocked(contentLoader.getEvents).mockReturnValue([]);
  vi.mocked(contentLoader.getGachas).mockReturnValue([]);
  vi.mocked(contentLoader.getGuides).mockReturnValue([]);
  vi.mocked(contentLoader.getItems).mockReturnValue([]);
  vi.mocked(contentLoader.getEpisodes).mockReturnValue([]);
  vi.mocked(contentLoader.getTools).mockReturnValue([]);
  vi.mocked(contentLoader.getAccessories).mockReturnValue([]);
  vi.mocked(contentLoader.getMissions).mockReturnValue([]);
  vi.mocked(contentLoader.getQuizzes).mockReturnValue([]);
}

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = SearchService.getInstance();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SearchService.getInstance();
      const instance2 = SearchService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Empty Query Handling', () => {
    it('should return empty results for empty query', () => {
      const results = searchService.search('');
      expect(results.total).toBe(0);
      expect(results.characters).toHaveLength(0);
      expect(results.guides).toHaveLength(0);
    });

    it('should return empty results for whitespace-only query', () => {
      const results = searchService.search('   ');
      expect(results.total).toBe(0);
    });
  });

  describe('Character Search', () => {
    beforeEach(() => {
      const mockCharacters: Character[] = [
        {
          id: 1,
          unique_key: 'kasumi',
          title: 'Kasumi',
          name: {
            en: 'Kasumi',
            jp: 'かすみ',
          } as LocalizedString,
          image: '/images/kasumi.jpg',
          status: 'published',
          category: 'character',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Character,
        {
          id: 2,
          unique_key: 'marie',
          title: 'Marie Rose',
          name: {
            en: 'Marie Rose',
            jp: 'マリー・ローズ',
          } as LocalizedString,
          image: '/images/marie.jpg',
          status: 'published',
          category: 'character',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Character,
      ];

      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
      setupEmptyMocks();
      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
    });

    it('should find characters by English name', () => {
      const results = searchService.search('Kasumi');
      expect(results.characters).toHaveLength(1);
      expect(results.characters[0].title).toBe('Kasumi');
    });

    it('should find characters by Japanese name', () => {
      const results = searchService.search('かすみ', { language: 'jp' });
      expect(results.characters).toHaveLength(1);
      expect(results.characters[0].unique_key).toBe('kasumi');
    });

    it('should be case-insensitive', () => {
      const results = searchService.search('KASUMI');
      expect(results.characters).toHaveLength(1);
      expect(results.characters[0].title).toBe('Kasumi');
    });

    it('should find partial matches', () => {
      const results = searchService.search('Marie');
      expect(results.characters).toHaveLength(1);
      expect(results.characters[0].title).toBe('Marie Rose');
    });

    it('should respect maxPerType limit', () => {
      const results = searchService.search('a', { maxPerType: 1 });
      expect(results.characters.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Guide Search', () => {
    beforeEach(() => {
      const mockGuides: Guide[] = [
        {
          id: 1,
          unique_key: 'beginner-guide',
          title: 'Beginner Guide',
          localizedTitle: {
            en: 'Beginner Guide',
            jp: '初心者ガイド',
          } as LocalizedString,
          content_ref: 'guides/beginner-guide.md',
          image: '/images/guide.jpg',
          difficulty: 'Easy',
          read_time: '5 min',
          status: 'published',
          category: 'guide',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Guide,
        {
          id: 2,
          unique_key: 'advanced-guide',
          title: 'Advanced Guide',
          localizedTitle: {
            en: 'Advanced Guide',
            jp: '上級ガイド',
          } as LocalizedString,
          content_ref: 'guides/advanced-guide.md',
          image: '/images/guide2.jpg',
          difficulty: 'Hard',
          read_time: '15 min',
          status: 'published',
          category: 'guide',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Guide,
      ];

      setupEmptyMocks();
      vi.mocked(contentLoader.getGuides).mockReturnValue(mockGuides);
    });

    it('should find guides by title', () => {
      const results = searchService.search('Beginner');
      expect(results.guides).toHaveLength(1);
      expect(results.guides[0].title).toBe('Beginner Guide');
    });

    it('should find guides by Japanese title', () => {
      const results = searchService.search('初心者', { language: 'jp' });
      expect(results.guides).toHaveLength(1);
    });

    it('should include difficulty badge', () => {
      const results = searchService.search('Beginner');
      expect(results.guides[0].badge).toBe('Easy');
      expect(results.guides[0].badgeVariant).toBe('default');
    });

    it('should include subtitle with difficulty and read time', () => {
      const results = searchService.search('Beginner');
      expect(results.guides[0].subtitle).toBe('Easy • 5 min');
    });
  });

  describe('Event Search', () => {
    beforeEach(() => {
      const mockEvents: Event[] = [
        {
          id: 1,
          unique_key: 'summer-event',
          title: 'Summer Event',
          name: {
            en: 'Summer Festival',
            jp: '夏祭り',
          } as LocalizedString,
          image: '/images/event.jpg',
          type: 'Festival',
          event_status: 'Active',
          status: 'published',
          category: 'event',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Event,
      ];

      setupEmptyMocks();
      vi.mocked(contentLoader.getEvents).mockReturnValue(mockEvents);
    });

    it('should find events by name', () => {
      const results = searchService.search('Summer');
      expect(results.events).toHaveLength(1);
      expect(results.events[0].title).toBe('Summer Festival');
    });

    it('should include event status badge', () => {
      const results = searchService.search('Summer');
      expect(results.events[0].badge).toBe('Active');
      expect(results.events[0].badgeVariant).toBe('default');
    });

    it('should include event type as subtitle', () => {
      const results = searchService.search('Summer');
      expect(results.events[0].subtitle).toBe('Festival');
    });
  });

  describe('Multi-Type Search', () => {
    beforeEach(() => {
      const mockCharacters: Character[] = [
        {
          id: 1,
          unique_key: 'test-char',
          title: 'Test Character',
          name: { en: 'Test Character', jp: 'テスト' } as LocalizedString,
          image: '/images/char.jpg',
          status: 'published',
          category: 'character',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Character,
      ];

      const mockGuides: Guide[] = [
        {
          id: 1,
          unique_key: 'test-guide',
          title: 'Test Guide',
          localizedTitle: { en: 'Test Guide', jp: 'テストガイド' } as LocalizedString,
          content_ref: 'guides/test.md',
          image: '/images/guide.jpg',
          difficulty: 'Easy',
          read_time: '5 min',
          status: 'published',
          category: 'guide',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Guide,
      ];

      setupEmptyMocks();
      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
      vi.mocked(contentLoader.getGuides).mockReturnValue(mockGuides);
    });

    it('should search across multiple content types', () => {
      const results = searchService.search('Test');
      expect(results.total).toBe(2);
      expect(results.characters).toHaveLength(1);
      expect(results.guides).toHaveLength(1);
    });

    it('should calculate total correctly', () => {
      const results = searchService.search('Test');
      const manualTotal =
        results.characters.length +
        results.swimsuits.length +
        results.events.length +
        results.gachas.length +
        results.guides.length +
        results.items.length +
        results.episodes.length;
      expect(results.total).toBe(manualTotal);
    });
  });

  describe('Language Support', () => {
    beforeEach(() => {
      const mockCharacters: Character[] = [
        {
          id: 1,
          unique_key: 'kasumi',
          title: 'Kasumi',
          name: {
            en: 'Kasumi',
            jp: 'かすみ',
            cn: '霞',
          } as LocalizedString,
          image: '/images/kasumi.jpg',
          status: 'published',
          category: 'character',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Character,
      ];

      setupEmptyMocks();
      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
    });

    it('should search in English by default', () => {
      const results = searchService.search('Kasumi');
      expect(results.characters).toHaveLength(1);
      expect(results.characters[0].title).toBe('Kasumi');
    });

    it('should search in Japanese when specified', () => {
      const results = searchService.search('かすみ', { language: 'jp' });
      expect(results.characters).toHaveLength(1);
    });

    it('should search in Chinese when specified', () => {
      const results = searchService.search('霞', { language: 'cn' });
      expect(results.characters).toHaveLength(1);
    });

    it('should return localized title in results', () => {
      const results = searchService.search('Kasumi', { language: 'jp' });
      expect(results.characters[0].title).toBe('かすみ');
    });
  });

  describe('Special Characters and Edge Cases', () => {
    beforeEach(() => {
      const mockCharacters: Character[] = [
        {
          id: 1,
          unique_key: 'marie-rose',
          title: 'Marie Rose',
          name: {
            en: 'Marie-Rose',
            jp: 'マリー・ローズ',
          } as LocalizedString,
          image: '/images/marie.jpg',
          status: 'published',
          category: 'character',
          tags: [],
          updated_at: '2024-01-01',
          author: 'admin',
        } as unknown as Character,
      ];

      setupEmptyMocks();
      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
    });

    it('should handle hyphenated names', () => {
      const results = searchService.search('Marie-Rose');
      expect(results.characters).toHaveLength(1);
    });

    it('should handle special characters in Japanese', () => {
      const results = searchService.search('マリー・ローズ', { language: 'jp' });
      expect(results.characters).toHaveLength(1);
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchService.search(longQuery);
      expect(results.total).toBe(0);
    });

    it('should handle numeric queries', () => {
      const results = searchService.search('123');
      expect(results).toBeDefined();
      expect(results.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle queries with only special characters', () => {
      const results = searchService.search('!@#$%^&*()');
      expect(results.total).toBe(0);
    });
  });

  describe('Performance and Limits', () => {
    beforeEach(() => {
      const mockCharacters: Character[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        unique_key: `char-${i}`,
        title: `Character ${i}`,
        name: {
          en: `Character ${i}`,
          jp: `キャラ${i}`,
        } as LocalizedString,
        image: `/images/char-${i}.jpg`,
        status: 'published',
        category: 'character',
        tags: [],
        updated_at: '2024-01-01',
        author: 'admin',
      } as unknown as Character));

      setupEmptyMocks();
      vi.mocked(contentLoader.getCharacters).mockReturnValue(mockCharacters);
    });

    it('should respect maxPerType limit with many results', () => {
      const results = searchService.search('Character', { maxPerType: 5 });
      expect(results.characters.length).toBeLessThanOrEqual(5);
    });

    it('should handle maxPerType of 0', () => {
      const results = searchService.search('Character', { maxPerType: 0 });
      expect(results.characters).toHaveLength(0);
    });

    it('should handle maxPerType of 1', () => {
      const results = searchService.search('Character', { maxPerType: 1 });
      expect(results.characters).toHaveLength(1);
    });

    it('should handle very large maxPerType', () => {
      const results = searchService.search('Character', { maxPerType: 10000 });
      expect(results.characters.length).toBeGreaterThan(0);
      expect(results.characters.length).toBeLessThanOrEqual(100);
    });
  });


});
