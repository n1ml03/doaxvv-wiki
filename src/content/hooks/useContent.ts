/**
 * useContent Hook
 * TanStack Query-based hook for loading content types
 * Provides caching, deduplication, and background refetching
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { ContentLoader, ContentType } from '../loader';
import type {
  Guide,
  Character,
  Event,
  Swimsuit,
  Item,
  Episode,
  Gacha,
  Category,
  Tag,
  Tool,
  Accessory,
  Mission,
  Quiz,
} from '../schemas/content.schema';

export interface UseContentOptions {
  enabled?: boolean;
}

export interface UseContentResult<T> {
  data: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Content loader instance
const loader = ContentLoader.getInstance();

// Ensure initialization
const ensureInitialized = async () => {
  await loader.initialize();
};

// Query function factory
const createQueryFn = <T>(loadFn: () => Promise<T[]>) => async (): Promise<T[]> => {
  await ensureInitialized();
  return loadFn();
};

// Content type to query key and loader mapping
const contentConfig: Record<ContentType, { queryKey: readonly unknown[]; loadFn: () => Promise<unknown[]> }> = {
  characters: { queryKey: queryKeys.content.characters(), loadFn: () => loader.loadCharacters() },
  guides: { queryKey: queryKeys.content.guides(), loadFn: () => loader.loadGuides() },
  events: { queryKey: queryKeys.content.events(), loadFn: () => loader.loadEvents() },
  swimsuits: { queryKey: queryKeys.content.swimsuits(), loadFn: () => loader.loadSwimsuits() },
  items: { queryKey: queryKeys.content.items(), loadFn: () => loader.loadItems() },
  episodes: { queryKey: queryKeys.content.episodes(), loadFn: () => loader.loadEpisodes() },
  gachas: { queryKey: queryKeys.content.gachas(), loadFn: () => loader.loadGachas() },
  categories: { queryKey: queryKeys.content.categories(), loadFn: () => loader.loadCategories() },
  tags: { queryKey: queryKeys.content.tags(), loadFn: () => loader.loadTags() },
  tools: { queryKey: queryKeys.content.tools(), loadFn: () => loader.loadTools() },
  accessories: { queryKey: queryKeys.content.accessories(), loadFn: () => loader.loadAccessories() },
  missions: { queryKey: queryKeys.content.missions(), loadFn: () => loader.loadMissions() },
  festivals: { queryKey: queryKeys.content.festivals(), loadFn: () => loader.loadFestivals() },
  quizzes: { queryKey: queryKeys.content.quizzes(), loadFn: () => loader.loadQuizzes() },
};

/**
 * Generic hook for loading content by type using TanStack Query
 */
export function useContent<T>(
  contentType: ContentType,
  options: UseContentOptions = {}
): UseContentResult<T> {
  const { enabled = true } = options;
  const config = contentConfig[contentType];

  const query = useQuery({
    queryKey: config.queryKey,
    queryFn: createQueryFn(config.loadFn),
    enabled,
  });

  return {
    data: query.data as T[] | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => { await query.refetch(); },
  };
}
