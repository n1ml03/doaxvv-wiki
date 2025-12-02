/**
 * useQuizTimer Hook Tests
 * Tests for countdown timer functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizTimer } from '../../../../src/features/quiz/hooks/useQuizTimer';

describe('useQuizTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with correct initial time', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300 })
      );

      expect(result.current.timeRemaining).toBe(300);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('should auto-start when autoStart is true', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300, autoStart: true })
      );

      expect(result.current.isRunning).toBe(true);
    });

    it('should format time correctly', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 125 }) // 2:05
      );

      expect(result.current.formattedTime).toBe('02:05');
    });

    it('should format zero time correctly', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 0 })
      );

      expect(result.current.formattedTime).toBe('00:00');
    });
  });

  describe('start', () => {
    it('should start the timer', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300 })
      );

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('should not start if already expired', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 0 })
      );

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('should decrement time when running', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 10 })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(9);
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300, autoStart: true })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(299);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Time should not change after pause
      expect(result.current.timeRemaining).toBe(299);
    });
  });

  describe('reset', () => {
    it('should reset to initial time', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300, autoStart: true })
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(295);

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(300);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('should reset to new time when provided', () => {
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 300 })
      );

      act(() => {
        result.current.reset(600);
      });

      expect(result.current.timeRemaining).toBe(600);
    });
  });

  describe('expiration', () => {
    it('should expire when time reaches zero', () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 3, onExpire, autoStart: true })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isExpired).toBe(true);
      expect(result.current.isRunning).toBe(false);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('should call onTick callback every second', () => {
      const onTick = vi.fn();
      const { result } = renderHook(() =>
        useQuizTimer({ initialTime: 5, onTick, autoStart: true })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onTick).toHaveBeenCalledTimes(3);
      expect(onTick).toHaveBeenCalledWith(4);
      expect(onTick).toHaveBeenCalledWith(3);
      expect(onTick).toHaveBeenCalledWith(2);
    });
  });

  describe('formattedTime', () => {
    it('should format minutes and seconds correctly', () => {
      const testCases = [
        { time: 0, expected: '00:00' },
        { time: 59, expected: '00:59' },
        { time: 60, expected: '01:00' },
        { time: 125, expected: '02:05' },
        { time: 3600, expected: '60:00' },
      ];

      testCases.forEach(({ time, expected }) => {
        const { result } = renderHook(() =>
          useQuizTimer({ initialTime: time })
        );
        expect(result.current.formattedTime).toBe(expected);
      });
    });
  });

  describe('cleanup', () => {
    it('should clear interval on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useQuizTimer({ initialTime: 300, autoStart: true })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(299);

      unmount();

      // No errors should occur after unmount
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    });
  });
});
