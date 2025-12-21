/**
 * React Router v7 Data Loaders
 * Optimized for lazy loading - only loads data needed for each route
 * Removed redundant initialize() calls for better performance
 */

import type { LoaderFunctionArgs } from 'react-router-dom';
import { queryClient, queryKeys } from '../query-client';
import { contentLoader } from '@/content';

// ============================================================================
// Character Loaders
// ============================================================================

export async function charactersLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.characters(),
    queryFn: () => contentLoader.loadCharacters(),
  });
}

export async function characterDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  // Load only what's needed for this page in parallel
  const [characters, swimsuits, guides] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.content.characters(),
      queryFn: () => contentLoader.loadCharacters(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.swimsuits(),
      queryFn: () => contentLoader.loadSwimsuits(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.guides(),
      queryFn: () => contentLoader.loadGuides(),
    }),
  ]);

  const character = characters.find(c => c.unique_key === unique_key);
  if (!character) throw new Response('Not Found', { status: 404 });

  return {
    character,
    characterSwimsuits: swimsuits.filter(s => s.character_id === unique_key),
    otherGirls: characters.filter(c => c.id !== character.id).slice(0, 4),
    relatedGuides: guides.filter(g => 
      g.category === 'Team Building' || g.topics.some(t => t.toLowerCase().includes('character'))
    ).slice(0, 4),
  };
}

// ============================================================================
// Event Loaders
// ============================================================================

export async function eventsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.events(),
    queryFn: () => contentLoader.loadEvents(),
  });
}

export async function eventDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const [events, gachas, episodes, missions] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.content.events(),
      queryFn: () => contentLoader.loadEvents(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.gachas(),
      queryFn: () => contentLoader.loadGachas(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.episodes(),
      queryFn: () => contentLoader.loadEpisodes(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.missions(),
      queryFn: () => contentLoader.loadMissions(),
    }),
  ]);

  const event = events.find(e => e.unique_key === unique_key);
  if (!event) throw new Response('Not Found', { status: 404 });

  return {
    event,
    relatedGachas: gachas.filter(g => event.gacha_ids?.includes(g.unique_key)),
    relatedEpisodes: episodes.filter(e => event.episode_ids?.includes(e.unique_key)),
    relatedMissions: missions.filter(m => event.mission_ids?.includes(m.unique_key)),
  };
}

// ============================================================================
// Swimsuit Loaders
// ============================================================================

export async function swimsuitsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.swimsuits(),
    queryFn: () => contentLoader.loadSwimsuits(),
  });
}

export async function swimsuitDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const swimsuits = await queryClient.fetchQuery({
    queryKey: queryKeys.content.swimsuits(),
    queryFn: () => contentLoader.loadSwimsuits(),
  });

  const swimsuit = swimsuits.find(s => s.unique_key === unique_key);
  if (!swimsuit) throw new Response('Not Found', { status: 404 });
  return { swimsuit };
}

// ============================================================================
// Guide Loaders
// ============================================================================

export async function guidesLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.guides(),
    queryFn: () => contentLoader.loadGuides(),
  });
}

export async function guideDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const guides = await queryClient.fetchQuery({
    queryKey: queryKeys.content.guides(),
    queryFn: () => contentLoader.loadGuides(),
  });

  const guide = guides.find(g => g.unique_key === unique_key);
  if (!guide) throw new Response('Not Found', { status: 404 });
  return { guide };
}

// ============================================================================
// Gacha Loaders
// ============================================================================

export async function gachasLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.gachas(),
    queryFn: () => contentLoader.loadGachas(),
  });
}

export async function gachaDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const [gachas, swimsuits] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.content.gachas(),
      queryFn: () => contentLoader.loadGachas(),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.content.swimsuits(),
      queryFn: () => contentLoader.loadSwimsuits(),
    }),
  ]);

  const gacha = gachas.find(g => g.unique_key === unique_key);
  if (!gacha) throw new Response('Not Found', { status: 404 });

  return {
    gacha,
    featuredSwimsuits: swimsuits.filter(s => gacha.featured_swimsuits?.includes(s.unique_key)),
  };
}

// ============================================================================
// Item Loaders
// ============================================================================

export async function itemsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.items(),
    queryFn: () => contentLoader.loadItems(),
  });
}

export async function itemDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const items = await queryClient.fetchQuery({
    queryKey: queryKeys.content.items(),
    queryFn: () => contentLoader.loadItems(),
  });

  const item = items.find(i => i.unique_key === unique_key);
  if (!item) throw new Response('Not Found', { status: 404 });
  return { item };
}

// ============================================================================
// Episode Loaders
// ============================================================================

export async function episodesLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.episodes(),
    queryFn: () => contentLoader.loadEpisodes(),
  });
}

export async function episodeDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const episodes = await queryClient.fetchQuery({
    queryKey: queryKeys.content.episodes(),
    queryFn: () => contentLoader.loadEpisodes(),
  });

  const episode = episodes.find(e => e.unique_key === unique_key);
  if (!episode) throw new Response('Not Found', { status: 404 });
  return { episode };
}

// ============================================================================
// Accessory Loaders
// ============================================================================

export async function accessoriesLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.accessories(),
    queryFn: () => contentLoader.loadAccessories(),
  });
}

export async function accessoryDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const accessories = await queryClient.fetchQuery({
    queryKey: queryKeys.content.accessories(),
    queryFn: () => contentLoader.loadAccessories(),
  });

  const accessory = accessories.find(a => a.unique_key === unique_key);
  if (!accessory) throw new Response('Not Found', { status: 404 });
  return { accessory };
}

// ============================================================================
// Mission Loaders
// ============================================================================

export async function missionsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.missions(),
    queryFn: () => contentLoader.loadMissions(),
  });
}

export async function missionDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const missions = await queryClient.fetchQuery({
    queryKey: queryKeys.content.missions(),
    queryFn: () => contentLoader.loadMissions(),
  });

  const mission = missions.find(m => m.unique_key === unique_key);
  if (!mission) throw new Response('Not Found', { status: 404 });
  return { mission };
}

// ============================================================================
// Festival Loaders
// ============================================================================

export async function festivalsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.festivals(),
    queryFn: () => contentLoader.loadFestivals(),
  });
}

export async function festivalDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const festivals = await queryClient.fetchQuery({
    queryKey: queryKeys.content.festivals(),
    queryFn: () => contentLoader.loadFestivals(),
  });

  const festival = festivals.find(f => f.unique_key === unique_key);
  if (!festival) throw new Response('Not Found', { status: 404 });
  return { festival };
}

// ============================================================================
// Tool Loaders
// ============================================================================

export async function toolsLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.tools(),
    queryFn: () => contentLoader.loadTools(),
  });
}

export async function toolDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const tools = await queryClient.fetchQuery({
    queryKey: queryKeys.content.tools(),
    queryFn: () => contentLoader.loadTools(),
  });

  const tool = tools.find(t => t.unique_key === unique_key);
  if (!tool) throw new Response('Not Found', { status: 404 });
  return { tool };
}

// ============================================================================
// Quiz Loaders
// ============================================================================

export async function quizzesLoader() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.content.quizzes(),
    queryFn: () => contentLoader.loadQuizzes(),
  });
}

export async function quizDetailLoader({ params }: LoaderFunctionArgs) {
  const { unique_key } = params;
  if (!unique_key) throw new Response('Not Found', { status: 404 });

  const quizzes = await queryClient.fetchQuery({
    queryKey: queryKeys.content.quizzes(),
    queryFn: () => contentLoader.loadQuizzes(),
  });

  const quiz = quizzes.find(q => q.unique_key === unique_key);
  if (!quiz) throw new Response('Not Found', { status: 404 });
  return { quiz };
}

// ============================================================================
// Home Page Loader - Only load what's visible on home page
// ============================================================================

export async function homeLoader() {
  // Only prefetch the 3 content types actually shown on home page
  // Characters, Events, and Guides - loaded in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.content.characters(),
      queryFn: () => contentLoader.loadCharacters(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.content.events(),
      queryFn: () => contentLoader.loadEvents(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.content.guides(),
      queryFn: () => contentLoader.loadGuides(),
    }),
  ]);
  
  return null;
}
