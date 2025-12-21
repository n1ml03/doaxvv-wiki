/**
 * TanStack Query hooks for content loading
 * Provides caching, deduplication, and background refetching
 */

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-client';
import { contentLoader } from '@/content';

// Ensure content loader is initialized
const ensureInitialized = async () => {
  await contentLoader.initialize();
};

// ============================================================================
// Character Queries
// ============================================================================

export function useCharactersQuery() {
  return useQuery({
    queryKey: queryKeys.content.characters(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getCharacters();
    },
  });
}

export function useCharacterQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.character(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getCharacterByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// Suspense version for React Router loaders
export function useCharactersSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.content.characters(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getCharacters();
    },
  });
}

// ============================================================================
// Event Queries
// ============================================================================

export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.content.events(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getEvents();
    },
  });
}

export function useEventQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.event(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getEventByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Swimsuit Queries
// ============================================================================

export function useSwimsuitsQuery() {
  return useQuery({
    queryKey: queryKeys.content.swimsuits(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getSwimsuits();
    },
  });
}

export function useSwimsuitQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.swimsuit(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getSwimsuitByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Guide Queries
// ============================================================================

export function useGuidesQuery() {
  return useQuery({
    queryKey: queryKeys.content.guides(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getGuides();
    },
  });
}

export function useGuideQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.guide(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getGuideByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Gacha Queries
// ============================================================================

export function useGachasQuery() {
  return useQuery({
    queryKey: queryKeys.content.gachas(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getGachas();
    },
  });
}

export function useGachaQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.gacha(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getGachaByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Item Queries
// ============================================================================

export function useItemsQuery() {
  return useQuery({
    queryKey: queryKeys.content.items(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getItems();
    },
  });
}

export function useItemQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.item(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getItemByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Episode Queries
// ============================================================================

export function useEpisodesQuery() {
  return useQuery({
    queryKey: queryKeys.content.episodes(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getEpisodes();
    },
  });
}

export function useEpisodeQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.episode(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getEpisodeByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Accessory Queries
// ============================================================================

export function useAccessoriesQuery() {
  return useQuery({
    queryKey: queryKeys.content.accessories(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getAccessories();
    },
  });
}

export function useAccessoryQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.accessory(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getAccessoryByKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Mission Queries
// ============================================================================

export function useMissionsQuery() {
  return useQuery({
    queryKey: queryKeys.content.missions(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getMissions();
    },
  });
}

export function useMissionQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.mission(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getMissionByKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Festival Queries
// ============================================================================

export function useFestivalsQuery() {
  return useQuery({
    queryKey: queryKeys.content.festivals(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getFestivals();
    },
  });
}

export function useFestivalQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.festival(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getFestivalByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Tool Queries
// ============================================================================

export function useToolsQuery() {
  return useQuery({
    queryKey: queryKeys.content.tools(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getTools();
    },
  });
}

export function useToolQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.tool(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getToolByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Quiz Queries
// ============================================================================

export function useQuizzesQuery() {
  return useQuery({
    queryKey: queryKeys.content.quizzes(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getQuizzes();
    },
  });
}

export function useQuizQuery(uniqueKey: string) {
  return useQuery({
    queryKey: queryKeys.content.quiz(uniqueKey),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getQuizByUniqueKey(uniqueKey);
    },
    enabled: !!uniqueKey,
  });
}

// ============================================================================
// Category & Tag Queries
// ============================================================================

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.content.categories(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getCategories();
    },
  });
}

export function useTagsQuery() {
  return useQuery({
    queryKey: queryKeys.content.tags(),
    queryFn: async () => {
      await ensureInitialized();
      return contentLoader.getTags();
    },
  });
}

// ============================================================================
// Combined/Related Content Queries
// ============================================================================

export function useCharacterWithSwimsuitsQuery(uniqueKey: string) {
  return useQuery({
    queryKey: [...queryKeys.content.character(uniqueKey), 'with-swimsuits'],
    queryFn: async () => {
      await ensureInitialized();
      const character = contentLoader.getCharacterByUniqueKey(uniqueKey);
      if (!character) return null;
      
      const swimsuits = contentLoader.getSwimsuits()
        .filter(s => s.character_id === uniqueKey);
      
      return { character, swimsuits };
    },
    enabled: !!uniqueKey,
  });
}
