/**
 * TanStack Query Client Configuration
 * Centralized query client with optimized defaults for content loading
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Content is relatively static, cache for 10 minutes
      staleTime: 10 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus for static content
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect for static content
      refetchOnReconnect: false,
    },
  },
});

// Query keys factory for type-safe and consistent query keys
export const queryKeys = {
  // Content queries
  content: {
    all: ['content'] as const,
    characters: () => [...queryKeys.content.all, 'characters'] as const,
    character: (key: string) => [...queryKeys.content.characters(), key] as const,
    events: () => [...queryKeys.content.all, 'events'] as const,
    event: (key: string) => [...queryKeys.content.events(), key] as const,
    swimsuits: () => [...queryKeys.content.all, 'swimsuits'] as const,
    swimsuit: (key: string) => [...queryKeys.content.swimsuits(), key] as const,
    guides: () => [...queryKeys.content.all, 'guides'] as const,
    guide: (key: string) => [...queryKeys.content.guides(), key] as const,
    gachas: () => [...queryKeys.content.all, 'gachas'] as const,
    gacha: (key: string) => [...queryKeys.content.gachas(), key] as const,
    items: () => [...queryKeys.content.all, 'items'] as const,
    item: (key: string) => [...queryKeys.content.items(), key] as const,
    episodes: () => [...queryKeys.content.all, 'episodes'] as const,
    episode: (key: string) => [...queryKeys.content.episodes(), key] as const,
    accessories: () => [...queryKeys.content.all, 'accessories'] as const,
    accessory: (key: string) => [...queryKeys.content.accessories(), key] as const,
    missions: () => [...queryKeys.content.all, 'missions'] as const,
    mission: (key: string) => [...queryKeys.content.missions(), key] as const,
    festivals: () => [...queryKeys.content.all, 'festivals'] as const,
    festival: (key: string) => [...queryKeys.content.festivals(), key] as const,
    tools: () => [...queryKeys.content.all, 'tools'] as const,
    tool: (key: string) => [...queryKeys.content.tools(), key] as const,
    quizzes: () => [...queryKeys.content.all, 'quizzes'] as const,
    quiz: (key: string) => [...queryKeys.content.quizzes(), key] as const,
    categories: () => [...queryKeys.content.all, 'categories'] as const,
    tags: () => [...queryKeys.content.all, 'tags'] as const,
  },
  // Search queries
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, query] as const,
  },
} as const;
