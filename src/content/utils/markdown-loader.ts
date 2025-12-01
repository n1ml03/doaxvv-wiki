/**
 * Markdown Loader Utility
 * 
 * Supports loading markdown content from:
 * - Bundled files (default, via import.meta.glob)
 * - Windows paths (C:\path\to\guides\)
 * - Unix paths (/path/to/guides/)
 * - Relative paths (./guides/)
 * 
 * Features:
 * - Configurable base path for external markdown files
 * - Path normalization for cross-platform support
 * - Caching for performance
 */

import {
  isWindowsPath,
  isUnixAbsolutePath,
  normalizeWindowsPath,
} from './image-loader';

// ============================================================================
// Configuration
// ============================================================================

export interface MarkdownLoaderConfig {
  /** Base path for external markdown files (can be Windows or Unix path) */
  basePath: string;
  /** Whether to use bundled files (default) or external files */
  useExternalFiles: boolean;
}

const DEFAULT_CONFIG: MarkdownLoaderConfig = {
  basePath: '',
  useExternalFiles: false,
};

let globalConfig: MarkdownLoaderConfig = { ...DEFAULT_CONFIG };

/**
 * Set the markdown loader configuration
 */
export function setMarkdownLoaderConfig(config: Partial<MarkdownLoaderConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current markdown loader configuration
 */
export function getMarkdownLoaderConfig(): MarkdownLoaderConfig {
  return { ...globalConfig };
}

/**
 * Reset configuration to defaults
 */
export function resetMarkdownLoaderConfig(): void {
  globalConfig = { ...DEFAULT_CONFIG };
}

/**
 * Set the base path for external markdown files
 * Supports Windows paths (C:\Users\...\guides) and Unix paths (/home/.../guides)
 */
export function setMarkdownBasePath(basePath: string): void {
  globalConfig.basePath = basePath;
  globalConfig.useExternalFiles = basePath.length > 0;
}

/**
 * Get the current markdown base path
 */
export function getMarkdownBasePath(): string {
  return globalConfig.basePath;
}

// ============================================================================
// Bundled Files (Default Mode)
// ============================================================================

// Import all guide markdown files as raw text
const guideModules = import.meta.glob('../data/guides/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Import all tool markdown files as raw text
const toolModules = import.meta.glob('../data/tools/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// ============================================================================
// Path Resolution
// ============================================================================

/**
 * Resolve a content_ref path to a full file path
 * @param contentRef - Path like "guides/beginner-guide.md"
 * @returns Full resolved path
 */
export function resolveMarkdownPath(contentRef: string): string {
  const { basePath } = globalConfig;

  if (!basePath) {
    return contentRef;
  }

  // Normalize the content ref (remove leading ./ or /)
  const normalizedRef = contentRef.replace(/^\.?\//, '');

  // Handle Windows base path
  if (isWindowsPath(basePath)) {
    const normalizedBase = basePath.replace(/\\+$/, '').replace(/\/+$/, '');
    // Extract just the filename from content_ref
    const filename = normalizedRef.split('/').pop() || normalizedRef;
    return `${normalizedBase}\\${filename}`;
  }

  // Handle Unix absolute path
  if (isUnixAbsolutePath(basePath)) {
    const normalizedBase = basePath.replace(/\/+$/, '');
    const filename = normalizedRef.split('/').pop() || normalizedRef;
    return `${normalizedBase}/${filename}`;
  }

  // Handle relative base path
  const normalizedBase = basePath.replace(/\/+$/, '');
  const filename = normalizedRef.split('/').pop() || normalizedRef;
  return `${normalizedBase}/${filename}`;
}

// ============================================================================
// Content Loading
// ============================================================================

/** Cache for loaded markdown content */
const markdownCache = new Map<string, string>();

/** Cache for externally loaded content */
const externalContentCache = new Map<string, string>();

/**
 * Get markdown content by content_ref path
 * @param contentRef - Path like "guides/beginner-guide.md"
 * @returns The markdown content or null if not found
 */
export function getMarkdownContent(contentRef: string): string | null {
  if (markdownCache.has(contentRef)) {
    return markdownCache.get(contentRef)!;
  }

  if (globalConfig.useExternalFiles && externalContentCache.has(contentRef)) {
    return externalContentCache.get(contentRef)!;
  }

  if (!globalConfig.useExternalFiles) {
    return getBundledMarkdownContent(contentRef);
  }

  return null;
}

/** Get bundled markdown content (from import.meta.glob) */
function getBundledMarkdownContent(contentRef: string): string | null {
  const modulePath = `../${contentRef}`;

  // Search in guide modules
  for (const [path, content] of Object.entries(guideModules)) {
    if (path.endsWith(contentRef) || path === modulePath) {
      markdownCache.set(contentRef, content);
      return content;
    }
  }

  // Search in tool modules
  for (const [path, content] of Object.entries(toolModules)) {
    if (path.endsWith(contentRef) || path === modulePath) {
      markdownCache.set(contentRef, content);
      return content;
    }
  }

  return null;
}

/**
 * Load markdown content asynchronously (for external files)
 * @param contentRef - Path like "guides/beginner-guide.md"
 * @returns Promise resolving to markdown content or null
 */
export async function loadMarkdownContentAsync(
  contentRef: string
): Promise<string | null> {
  if (markdownCache.has(contentRef)) {
    return markdownCache.get(contentRef)!;
  }

  if (externalContentCache.has(contentRef)) {
    return externalContentCache.get(contentRef)!;
  }

  if (!globalConfig.useExternalFiles) {
    return getBundledMarkdownContent(contentRef);
  }

  const fullPath = resolveMarkdownPath(contentRef);

  console.warn(
    `External markdown loading requires pre-loading. ` +
      `Path: ${fullPath}. Use setExternalMarkdownContent() to pre-load.`
  );

  return null;
}

/**
 * Set external markdown content directly into cache
 * Use this to pre-load content from external sources
 */
export function setExternalMarkdownContent(
  contentRef: string,
  content: string
): void {
  externalContentCache.set(contentRef, content);
}

/**
 * Bulk set external markdown content
 */
export function setExternalMarkdownContents(
  contents: Record<string, string>
): void {
  for (const [ref, content] of Object.entries(contents)) {
    externalContentCache.set(ref, content);
  }
}

/** Clear external content cache */
export function clearExternalMarkdownCache(): void {
  externalContentCache.clear();
}

// ============================================================================
// Markdown Parsing
// ============================================================================

export interface MarkdownSection {
  level: number;
  title: string;
  content: string;
  id: string;
}

// Vietnamese character normalization map for consistent ID generation
const vietnameseMap: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
};

/**
 * Normalize Vietnamese text to ASCII for URL-safe IDs
 * This must match the normalization in MarkdownRenderer.tsx
 */
function normalizeVietnamese(text: string): string {
  return text
    .split('')
    .map(char => vietnameseMap[char] || vietnameseMap[char.toLowerCase()] || char)
    .join('');
}

/**
 * Generate ID from heading text for anchor links
 * This must match the generateId function in MarkdownRenderer.tsx
 */
export function generateId(text: string): string {
  return normalizeVietnamese(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse markdown content into structured sections
 */
export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split('\n');
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;
  let contentLines: string[] = [];

  const flushSection = () => {
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      sections.push(currentSection);
      contentLines = [];
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      flushSection();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const id = generateId(title);

      currentSection = { level, title, content: '', id };
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  flushSection();
  return sections;
}

/**
 * Convert markdown to simple HTML
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(
    /^- \[ \]\s+(.+)$/gm,
    '<li class="task-item unchecked">$1</li>'
  );
  html = html.replace(
    /^- \[x\]\s+(.+)$/gm,
    '<li class="task-item checked">$1</li>'
  );
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    (match) => `<ul>${match}</ul>`
  );

  html = html.replace(/^(?!<[hul]|$)(.+)$/gm, '<p>$1</p>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Get all available guide content refs from bundled files */
export function getAvailableGuides(): string[] {
  return Object.keys(guideModules).map((path) => {
    const match = path.match(/[^/]+\.md$/);
    return match ? match[0] : path;
  });
}

/** Get all available tool content refs from bundled files */
export function getAvailableTools(): string[] {
  return Object.keys(toolModules).map((path) => {
    const match = path.match(/[^/]+\.md$/);
    return match ? match[0] : path;
  });
}

/** Preload all bundled guide markdown files into cache */
export function preloadGuides(): void {
  for (const [path, content] of Object.entries(guideModules)) {
    const match = path.match(/[^/]+\.md$/);
    if (match) {
      markdownCache.set(match[0], content);
    }
  }
}

/** Preload all bundled tool markdown files into cache */
export function preloadTools(): void {
  for (const [path, content] of Object.entries(toolModules)) {
    const match = path.match(/[^/]+\.md$/);
    if (match) {
      markdownCache.set(match[0], content);
    }
  }
}

/** Clear the markdown cache (both bundled and external) */
export function clearMarkdownCache(): void {
  markdownCache.clear();
  externalContentCache.clear();
}

/** Check if a content_ref has content available */
export function hasMarkdownContent(contentRef: string): boolean {
  if (markdownCache.has(contentRef) || externalContentCache.has(contentRef)) {
    return true;
  }

  const modulePath = `../${contentRef}`;
  
  // Check in guide modules
  for (const path of Object.keys(guideModules)) {
    if (path.endsWith(contentRef) || path === modulePath) {
      return true;
    }
  }

  // Check in tool modules
  for (const path of Object.keys(toolModules)) {
    if (path.endsWith(contentRef) || path === modulePath) {
      return true;
    }
  }

  return false;
}
