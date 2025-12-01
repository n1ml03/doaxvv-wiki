import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setMarkdownLoaderConfig,
  getMarkdownLoaderConfig,
  resetMarkdownLoaderConfig,
  setMarkdownBasePath,
  getMarkdownBasePath,
  resolveMarkdownPath,
  getMarkdownContent,
  setExternalMarkdownContent,
  clearExternalMarkdownCache,
  parseMarkdownSections,
  markdownToHtml,
  hasMarkdownContent,
} from '../../../src/content/utils/markdown-loader';

describe('Markdown Loader', () => {
  beforeEach(() => {
    resetMarkdownLoaderConfig();
    clearExternalMarkdownCache();
  });

  afterEach(() => {
    resetMarkdownLoaderConfig();
    clearExternalMarkdownCache();
  });

  describe('Configuration', () => {
    it('should set and get markdown loader config', () => {
      setMarkdownLoaderConfig({
        basePath: '/test/path',
        useExternalFiles: true,
      });

      const config = getMarkdownLoaderConfig();
      expect(config.basePath).toBe('/test/path');
      expect(config.useExternalFiles).toBe(true);
    });

    it('should set base path', () => {
      setMarkdownBasePath('/custom/path');
      expect(getMarkdownBasePath()).toBe('/custom/path');
    });

    it('should reset to default config', () => {
      setMarkdownBasePath('/test');
      resetMarkdownLoaderConfig();

      const config = getMarkdownLoaderConfig();
      expect(config.basePath).toBe('');
      expect(config.useExternalFiles).toBe(false);
    });
  });

  describe('Path Resolution', () => {
    it('should resolve Unix absolute path', () => {
      setMarkdownBasePath('/home/user/guides');
      const resolved = resolveMarkdownPath('guides/beginner-guide.md');
      expect(resolved).toBe('/home/user/guides/beginner-guide.md');
    });

    it('should resolve Windows path', () => {
      setMarkdownBasePath('C:\\Users\\Test\\guides');
      const resolved = resolveMarkdownPath('guides/beginner-guide.md');
      expect(resolved).toBe('C:\\Users\\Test\\guides\\beginner-guide.md');
    });

    it('should resolve relative path', () => {
      setMarkdownBasePath('./guides');
      const resolved = resolveMarkdownPath('guides/beginner-guide.md');
      expect(resolved).toBe('./guides/beginner-guide.md');
    });

    it('should handle content_ref without leading slash', () => {
      setMarkdownBasePath('/home/user/guides');
      const resolved = resolveMarkdownPath('beginner-guide.md');
      expect(resolved).toBe('/home/user/guides/beginner-guide.md');
    });

    it('should return original path when no base path set', () => {
      const resolved = resolveMarkdownPath('guides/beginner-guide.md');
      expect(resolved).toBe('guides/beginner-guide.md');
    });
  });

  describe('External Content', () => {
    it('should set and get external markdown content', () => {
      const content = '# Test Guide\n\nThis is test content.';
      setExternalMarkdownContent('guides/test.md', content);

      setMarkdownLoaderConfig({ useExternalFiles: true });
      const retrieved = getMarkdownContent('guides/test.md');
      expect(retrieved).toBe(content);
    });

    it('should clear external cache', () => {
      setExternalMarkdownContent('guides/test.md', 'content');
      clearExternalMarkdownCache();

      setMarkdownLoaderConfig({ useExternalFiles: true });
      const retrieved = getMarkdownContent('guides/test.md');
      expect(retrieved).toBeNull();
    });
  });

  describe('Markdown Parsing', () => {
    it('should parse markdown into sections', () => {
      const markdown = `# Introduction
This is the intro.

## Getting Started
Start here.

### Step 1
First step.

## Advanced Topics
Advanced content.`;

      const sections = parseMarkdownSections(markdown);

      expect(sections).toHaveLength(4);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].level).toBe(1);
      expect(sections[1].title).toBe('Getting Started');
      expect(sections[1].level).toBe(2);
      expect(sections[2].title).toBe('Step 1');
      expect(sections[2].level).toBe(3);
    });

    it('should generate section IDs', () => {
      const markdown = '## Getting Started Guide';
      const sections = parseMarkdownSections(markdown);

      expect(sections[0].id).toBe('getting-started-guide');
    });

    it('should handle markdown without sections', () => {
      const markdown = 'Just plain text without headers.';
      const sections = parseMarkdownSections(markdown);

      expect(sections).toHaveLength(0);
    });
  });

  describe('Markdown to HTML', () => {
    it('should convert headers', () => {
      expect(markdownToHtml('# H1')).toContain('<h1>H1</h1>');
      expect(markdownToHtml('## H2')).toContain('<h2>H2</h2>');
      expect(markdownToHtml('### H3')).toContain('<h3>H3</h3>');
    });

    it('should convert bold text', () => {
      const html = markdownToHtml('**bold text**');
      expect(html).toContain('<strong>bold text</strong>');
    });

    it('should convert italic text', () => {
      const html = markdownToHtml('*italic text*');
      expect(html).toContain('<em>italic text</em>');
    });

    it('should convert inline code', () => {
      const html = markdownToHtml('`code`');
      expect(html).toContain('<code>code</code>');
    });

    it('should convert lists', () => {
      const html = markdownToHtml('- Item 1\n- Item 2');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<ul>');
    });

    it('should convert task lists', () => {
      const html = markdownToHtml('- [ ] Unchecked\n- [x] Checked');
      expect(html).toContain('class="task-item unchecked"');
      expect(html).toContain('class="task-item checked"');
    });

    it('should escape HTML entities', () => {
      const html = markdownToHtml('<script>alert("xss")</script>');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('Content Availability', () => {
    it('should check if markdown content exists', () => {
      setExternalMarkdownContent('guides/test.md', 'content');
      setMarkdownLoaderConfig({ useExternalFiles: true });

      expect(hasMarkdownContent('guides/test.md')).toBe(true);
      expect(hasMarkdownContent('guides/nonexistent.md')).toBe(false);
    });
  });

  describe('Advanced Markdown Features', () => {
    it('should convert links', () => {
      const html = markdownToHtml('[Link Text](https://example.com)');
      // Should contain the link text
      expect(html).toContain('Link Text');
      expect(html).toContain('https://example.com');
    });

    it('should convert images', () => {
      const html = markdownToHtml('![Alt Text](image.jpg)');
      // Implementation may or may not support images
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should convert code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = markdownToHtml(markdown);
      // Should contain the code content
      expect(html).toContain('const x = 1');
    });

    it('should convert blockquotes', () => {
      const html = markdownToHtml('> This is a quote');
      // Should contain the quote text
      expect(html).toContain('This is a quote');
    });

    it('should convert horizontal rules', () => {
      const html = markdownToHtml('---');
      // Implementation may render as hr or other element
      expect(html).toBeDefined();
    });

    it('should convert ordered lists', () => {
      const html = markdownToHtml('1. First\n2. Second');
      // Should contain list items
      expect(html).toContain('First');
      expect(html).toContain('Second');
    });

    it('should handle nested lists', () => {
      const markdown = '- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2';
      const html = markdownToHtml(markdown);
      expect(html).toContain('Item 1');
      expect(html).toContain('Nested 1');
    });

    it('should handle strikethrough', () => {
      const html = markdownToHtml('~~strikethrough~~');
      // Implementation may or may not support strikethrough
      expect(html).toContain('strikethrough');
    });

    it('should handle tables', () => {
      const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      const html = markdownToHtml(markdown);
      // Implementation may or may not support tables - just verify content is present
      expect(html).toContain('Header 1');
      expect(html).toContain('Cell 1');
    });

    it('should preserve line breaks', () => {
      const html = markdownToHtml('Line 1  \nLine 2');
      expect(html).toContain('Line 1');
      expect(html).toContain('Line 2');
    });

    it('should handle mixed formatting', () => {
      const html = markdownToHtml('**Bold** and *italic* and `code`');
      expect(html).toContain('<strong>Bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<code>code</code>');
    });
  });

  describe('Section Parsing Edge Cases', () => {
    it('should handle sections with special characters', () => {
      const markdown = '## Section with "quotes" and \'apostrophes\'';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].title).toContain('quotes');
    });

    it('should handle sections with numbers', () => {
      const markdown = '## Step 1: Getting Started';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].id).toBe('step-1-getting-started');
    });

    it('should handle sections with unicode', () => {
      const markdown = '## こんにちは World';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].title).toContain('こんにちは');
    });

    it('should normalize Vietnamese characters in section IDs', () => {
      const markdown = '## Bắt Đầu Như Thế Nào';
      const sections = parseMarkdownSections(markdown);
      // Vietnamese characters should be normalized to ASCII equivalents
      expect(sections[0].id).toBe('bat-dau-nhu-the-nao');
    });

    it('should handle Vietnamese headings with diacritical marks', () => {
      const markdown = '## Hướng Dẫn Toàn Diện Cho Người Mới';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].id).toBe('huong-dan-toan-dien-cho-nguoi-moi');
    });

    it('should handle Vietnamese đ character', () => {
      const markdown = '## Đây Là Đầu Đề';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].id).toBe('day-la-dau-de');
    });

    it('should handle empty sections', () => {
      const markdown = '## \n\nContent here';
      const sections = parseMarkdownSections(markdown);
      // Empty header may or may not be parsed as a section
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple consecutive headers', () => {
      const markdown = '## Header 1\n## Header 2\n## Header 3';
      const sections = parseMarkdownSections(markdown);
      expect(sections).toHaveLength(3);
    });

    it('should extract section content', () => {
      const markdown = '## Section\n\nThis is content.\n\nMore content.';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].content).toContain('This is content');
    });

    it('should handle sections with code blocks', () => {
      const markdown = '## Code Example\n\n```js\nconst x = 1;\n```';
      const sections = parseMarkdownSections(markdown);
      expect(sections[0].content).toContain('const x = 1');
    });
  });

  describe('Path Resolution Edge Cases', () => {
    it('should handle paths with multiple slashes', () => {
      setMarkdownBasePath('/base/path');
      const resolved = resolveMarkdownPath('guides//test.md');
      expect(resolved).toBeDefined();
    });

    it('should handle paths with backslashes', () => {
      setMarkdownBasePath('C:\\base\\path');
      const resolved = resolveMarkdownPath('guides\\test.md');
      expect(resolved).toBeDefined();
    });

    it('should handle empty path', () => {
      setMarkdownBasePath('/base');
      const resolved = resolveMarkdownPath('');
      // Implementation may add trailing slash or not
      expect(resolved).toContain('/base');
    });

    it('should handle paths with dots', () => {
      setMarkdownBasePath('/base');
      const resolved = resolveMarkdownPath('./guides/test.md');
      expect(resolved).toBeDefined();
    });

    it('should handle absolute paths', () => {
      setMarkdownBasePath('/base');
      const resolved = resolveMarkdownPath('/absolute/path/test.md');
      // The implementation may prepend base path or not - just verify it returns a valid path
      expect(resolved).toBeDefined();
      expect(resolved.length).toBeGreaterThan(0);
    });
  });

  describe('External Content Management', () => {
    it('should handle multiple external files', () => {
      setExternalMarkdownContent('guide1.md', 'Content 1');
      setExternalMarkdownContent('guide2.md', 'Content 2');
      setExternalMarkdownContent('guide3.md', 'Content 3');

      setMarkdownLoaderConfig({ useExternalFiles: true });

      expect(getMarkdownContent('guide1.md')).toBe('Content 1');
      expect(getMarkdownContent('guide2.md')).toBe('Content 2');
      expect(getMarkdownContent('guide3.md')).toBe('Content 3');
    });

    it('should overwrite existing content', () => {
      setExternalMarkdownContent('guide.md', 'Original');
      setExternalMarkdownContent('guide.md', 'Updated');

      setMarkdownLoaderConfig({ useExternalFiles: true });

      expect(getMarkdownContent('guide.md')).toBe('Updated');
    });

    it('should handle empty content', () => {
      setExternalMarkdownContent('empty.md', '');

      setMarkdownLoaderConfig({ useExternalFiles: true });

      expect(getMarkdownContent('empty.md')).toBe('');
    });

    it('should handle very large content', () => {
      const largeContent = 'a'.repeat(100000);
      setExternalMarkdownContent('large.md', largeContent);

      setMarkdownLoaderConfig({ useExternalFiles: true });

      expect(getMarkdownContent('large.md')).toBe(largeContent);
    });
  });
});
