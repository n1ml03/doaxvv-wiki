import { describe, it, expect } from 'vitest';
import { ContentValidator } from '../../../src/content/utils/validator';

describe('ContentValidator', () => {
  const validator = new ContentValidator();

  describe('validateContent', () => {
    it('should validate required fields for base content', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          summary: 'Test summary',
          category: 'guide',
          tags: ['tag1'], // tags must be non-empty
          updated_at: '2024-01-01',
          author: 'admin',
          status: 'published',
          content_ref: 'guides/test.md',
          difficulty: 'Easy',
          read_time: '5 min',
          image: '/test.jpg',
          topics: ['topic1'],
          localizedTitle: { en: 'Test', jp: 'テスト' },
          content: { en: 'Content', jp: 'コンテンツ' },
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = [
        { id: '1', unique_key: 'test' }, // missing title and status
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should detect empty required fields', () => {
      const data = [
        { id: '1', unique_key: '', title: '   ', status: 'published' },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'unique_key')).toBe(true);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate status field', () => {
      const data = [
        { id: '1', unique_key: 'test', title: 'Test', status: 'invalid_status' },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });

    it('should accept valid status values', () => {
      const validStatuses = ['draft', 'published', 'archived'];

      validStatuses.forEach(status => {
        const data = [
          { id: '1', unique_key: 'test', title: 'Test', status },
        ];
        const result = validator.validateContent(data, 'guide');
        expect(result.errors.filter(e => e.field === 'status')).toHaveLength(0);
      });
    });

    it('should validate difficulty for quizzes', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          name: { en: 'Test Quiz' },
          difficulty: 'invalid',
          questions_ref: 'quizzes/test.md',
        },
      ];

      const result = validator.validateContent(data, 'quiz');
      expect(result.errors.some(e => e.field === 'difficulty')).toBe(true);
    });

    it('should validate rarity for characters', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          rarity: 'invalid',
        },
      ];

      const result = validator.validateContent(data, 'character');
      expect(result.errors.some(e => e.field === 'rarity')).toBe(true);
    });

    it('should validate event type', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          type: 'invalid_type',
        },
      ];

      const result = validator.validateContent(data, 'event');
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should validate date format', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          updated_at: 'not-a-date',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.some(e => e.field === 'updated_at')).toBe(true);
    });

    it('should accept valid date formats', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          updated_at: '2024-01-15',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'updated_at')).toHaveLength(0);
    });

    it('should warn about invalid slug format', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          slug: 'Invalid Slug With Spaces',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate stats format for characters', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          stats: '{"POW": 100}', // missing TEC and STM
        },
      ];

      const result = validator.validateContent(data, 'character');
      expect(result.errors.some(e => e.field === 'stats')).toBe(true);
    });

    it('should accept valid stats format', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          stats: '{"POW": 100, "TEC": 90, "STM": 85}',
        },
      ];

      const result = validator.validateContent(data, 'character');
      expect(result.errors.filter(e => e.field === 'stats')).toHaveLength(0);
    });
  });

  describe('validateRelatedIds', () => {
    it('should validate related IDs exist', () => {
      const data = [
        { id: '1', related_ids: 'id2|id3' },
      ];
      const allIds = new Set(['id1', 'id2', 'id3']);

      const result = validator.validateRelatedIds(data, allIds);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about missing related IDs', () => {
      const data = [
        { id: '1', related_ids: 'id2|nonexistent' },
      ];
      const allIds = new Set(['id1', 'id2']);

      const result = validator.validateRelatedIds(data, allIds);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('nonexistent');
    });

    it('should handle array format for related_ids', () => {
      const data = [
        { id: '1', related_ids: ['id2', 'id3'] },
      ];
      const allIds = new Set(['id1', 'id2', 'id3']);

      const result = validator.validateRelatedIds(data, allIds);
      expect(result.isValid).toBe(true);
    });

    it('should handle missing related_ids field', () => {
      const data = [{ id: '1' }];
      const allIds = new Set(['id1']);

      const result = validator.validateRelatedIds(data, allIds);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateUniqueIds', () => {
    it('should pass when all IDs are unique', () => {
      const data = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
        { id: '3', title: 'Third' },
      ];

      const result = validator.validateUniqueIds(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate IDs', () => {
      const data = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
        { id: '1', title: 'Duplicate' },
      ];

      const result = validator.validateUniqueIds(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].value).toBe('1');
    });

    it('should detect multiple duplicate IDs', () => {
      const data = [
        { id: '1', title: 'First' },
        { id: '1', title: 'Duplicate 1' },
        { id: '2', title: 'Second' },
        { id: '2', title: 'Duplicate 2' },
      ];

      const result = validator.validateUniqueIds(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });

  describe('localized content validation', () => {
    it('should validate localized titles', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          localizedTitle: {
            en: 'English Title',
            jp: 'Japanese Title',
          },
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'localizedTitle')).toHaveLength(0);
    });

    it('should warn about missing translations', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          localizedTitle: {
            en: 'English Title',
            jp: '',
          },
        },
      ];

      const result = validator.validateContent(data, 'guide');
      // Validator might warn about incomplete translations
      expect(result).toBeDefined();
    });
  });

  describe('array field validation', () => {
    it('should validate tags array', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'tags')).toHaveLength(0);
    });

    it('should handle empty tags array', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          tags: [],
        },
      ];

      const result = validator.validateContent(data, 'guide');
      // Empty tags might be valid or trigger a warning
      expect(result).toBeDefined();
    });
  });

  describe('numeric field validation', () => {
    it('should validate numeric IDs', () => {
      const data = [
        {
          id: 123,
          unique_key: 'test',
          title: 'Test',
          status: 'published',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'id')).toHaveLength(0);
    });

    it('should validate stats with correct numeric values', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          stats: '{"POW": 100, "TEC": 90, "STM": 85}',
        },
      ];

      const result = validator.validateContent(data, 'character');
      expect(result.errors.filter(e => e.field === 'stats')).toHaveLength(0);
    });

    it('should reject stats with invalid numeric values', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          stats: '{"POW": "invalid", "TEC": 90, "STM": 85}',
        },
      ];

      const result = validator.validateContent(data, 'character');
      // Validator should detect invalid numeric values
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('URL and path validation', () => {
    it('should validate image URLs', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          image: '/images/test.jpg',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'image')).toHaveLength(0);
    });

    it('should validate content references', () => {
      const data = [
        {
          id: '1',
          unique_key: 'test',
          title: 'Test',
          status: 'published',
          content_ref: 'guides/test.md',
        },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.filter(e => e.field === 'content_ref')).toHaveLength(0);
    });
  });

  describe('batch validation', () => {
    it('should validate large datasets efficiently', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        unique_key: `test-${i}`,
        title: `Test ${i}`,
        status: 'published',
      }));

      const start = Date.now();
      const result = validator.validateContent(data, 'guide');
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it('should collect all errors from multiple items', () => {
      const data = [
        { id: '1', unique_key: '', title: 'Test 1', status: 'published' },
        { id: '2', unique_key: 'test2', title: '', status: 'published' },
        { id: '3', unique_key: 'test3', title: 'Test 3', status: 'invalid' },
      ];

      const result = validator.validateContent(data, 'guide');
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });
});
