/**
 * useContent Hook
 * Generic React hook for loading content types with lazy loading
 * Provides loading state, error handling, and refetch functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '../schemas/content.schema';

export interface UseContentOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export interface UseContentResult<T> {
  data: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for loading content by type
 * Integrates with ContentLoader for on-demand lazy loading
 */
export function useContent<T>(
  contentType: ContentType,
  options: UseContentOptions = {}
): UseContentResult<T> {
  const { enabled = true, onError } = options;
  
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loaderRef = useRef<ContentLoader>(ContentLoader.getInstance());
  const isMountedRef = useRef<boolean>(true);

  const loadContent = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      let result: any[];

      switch (contentType) {
        case 'characters':
          result = await loaderRef.current.loadCharacters();
          break;
        case 'guides':
          result = await loaderRef.current.loadGuides();
          break;
        case 'events':
          result = await loaderRef.current.loadEvents();
          break;
        case 'swimsuits':
          result = await loaderRef.current.loadSwimsuits();
          break;
        case 'items':
          result = await loaderRef.current.loadItems();
          break;
        case 'episodes':
          result = await loaderRef.current.loadEpisodes();
          break;
        case 'gachas':
          result = await loaderRef.current.loadGachas();
          break;
        case 'categories':
          result = await loaderRef.current.loadCategories();
          break;
        case 'tags':
          result = await loaderRef.current.loadTags();
          break;
        case 'tools':
          result = await loaderRef.current.loadTools();
          break;
        case 'accessories':
          result = await loaderRef.current.loadAccessories();
          break;
        case 'missions':
          result = await loaderRef.current.loadMissions();
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result as T[]);
        setIsLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(error);
        setIsLoading(false);
        
        // Call error callback if provided
        if (onError) {
          onError(error);
        }
      }
    }
  }, [contentType, enabled, onError]);

  // Load content on mount or when dependencies change
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
