import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContent } from '@/content/hooks/useContent';
import { ContentLoader } from '@/content/loader';
import React from 'react';

// Mock ContentLoader
vi.mock('@/content/loader', () => {
  const mockLoader = {
    initialize: vi.fn().mockResolvedValue(undefined),
    loadCharacters: vi.fn(),
    loadGuides: vi.fn(),
    loadEvents: vi.fn(),
    loadSwimsuits: vi.fn(),
    loadItems: vi.fn(),
    loadEpisodes: vi.fn(),
    loadGachas: vi.fn(),
    loadCategories: vi.fn(),
    loadTags: vi.fn(),
    loadTools: vi.fn(),
    loadAccessories: vi.fn(),
    loadMissions: vi.fn(),
    loadFestivals: vi.fn(),
    loadQuizzes: vi.fn(),
  };

  return {
    ContentLoader: {
      getInstance: vi.fn(() => mockLoader),
    },
  };
});

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useContent', () => {
  const mockLoader = ContentLoader.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should start with loading state', () => {
      vi.mocked(mockLoader.loadCharacters).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after data loads', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      vi.mocked(mockLoader.loadCharacters).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('content types', () => {
    it('should load characters', async () => {
      const mockData = [{ id: 1, name: 'Character 1' }];
      vi.mocked(mockLoader.loadCharacters).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadCharacters).toHaveBeenCalled();
    });

    it('should load guides', async () => {
      const mockData = [{ id: 1, title: 'Guide 1' }];
      vi.mocked(mockLoader.loadGuides).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('guides'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadGuides).toHaveBeenCalled();
    });

    it('should load events', async () => {
      const mockData = [{ id: 1, name: 'Event 1' }];
      vi.mocked(mockLoader.loadEvents).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('events'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadEvents).toHaveBeenCalled();
    });

    it('should load swimsuits', async () => {
      const mockData = [{ id: 1, name: 'Swimsuit 1' }];
      vi.mocked(mockLoader.loadSwimsuits).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('swimsuits'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadSwimsuits).toHaveBeenCalled();
    });

    it('should load items', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      vi.mocked(mockLoader.loadItems).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('items'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadItems).toHaveBeenCalled();
    });

    it('should load episodes', async () => {
      const mockData = [{ id: 1, name: 'Episode 1' }];
      vi.mocked(mockLoader.loadEpisodes).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('episodes'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadEpisodes).toHaveBeenCalled();
    });

    it('should load gachas', async () => {
      const mockData = [{ id: 1, name: 'Gacha 1' }];
      vi.mocked(mockLoader.loadGachas).mockResolvedValue(mockData as any);

      const { result } = renderHook(() => useContent('gachas'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockLoader.loadGachas).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors', async () => {
      const mockError = new Error('Load failed');
      vi.mocked(mockLoader.loadCharacters).mockRejectedValue(mockError);

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('enabled option', () => {
    it('should not load when enabled is false', async () => {
      vi.mocked(mockLoader.loadCharacters).mockResolvedValue([]);

      renderHook(() => useContent('characters', { enabled: false }), {
        wrapper: createWrapper(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockLoader.loadCharacters).not.toHaveBeenCalled();
    });

    it('should load when enabled is true', async () => {
      vi.mocked(mockLoader.loadCharacters).mockResolvedValue([]);

      renderHook(() => useContent('characters', { enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockLoader.loadCharacters).toHaveBeenCalled();
      });
    });
  });

  describe('refetch', () => {
    it('should refetch data', async () => {
      const mockData1 = [{ id: 1, name: 'Data 1' }];
      const mockData2 = [{ id: 2, name: 'Data 2' }];
      
      vi.mocked(mockLoader.loadCharacters)
        .mockResolvedValueOnce(mockData1 as any)
        .mockResolvedValueOnce(mockData2 as any);

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });
    });

    it('should handle refetch errors', async () => {
      const mockData = [{ id: 1, name: 'Data' }];
      const mockError = new Error('Refetch failed');
      
      vi.mocked(mockLoader.loadCharacters)
        .mockResolvedValueOnce(mockData as any)
        .mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      const mockData = [{ id: 1, name: 'Data' }];
      vi.mocked(mockLoader.loadCharacters).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockData as any), 100))
      );

      const { result, unmount } = renderHook(() => useContent('characters'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not throw or update state after unmount
    });
  });
});
