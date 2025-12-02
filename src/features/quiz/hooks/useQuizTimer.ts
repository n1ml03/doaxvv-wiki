/**
 * useQuizTimer Hook
 * Manages countdown timer with start, pause, reset functions
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseQuizTimerOptions {
  /** Initial time in seconds */
  initialTime: number;
  /** Callback when timer reaches zero */
  onExpire?: () => void;
  /** Callback called every second with remaining time */
  onTick?: (timeRemaining: number) => void;
  /** Whether to auto-start the timer */
  autoStart?: boolean;
}

export interface UseQuizTimerResult {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer has expired */
  isExpired: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset the timer to initial time or a new time */
  reset: (newTime?: number) => void;
  /** Format time as MM:SS string */
  formattedTime: string;
}

/**
 * Formats seconds into MM:SS string
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook for managing a countdown timer
 * 
 * @param options - Timer configuration options
 * 
 * @example
 * ```tsx
 * const {
 *   timeRemaining,
 *   isRunning,
 *   start,
 *   pause,
 *   reset,
 *   formattedTime,
 * } = useQuizTimer({
 *   initialTime: 300, // 5 minutes
 *   onExpire: () => console.log('Time is up!'),
 *   autoStart: true,
 * });
 * ```
 */
export function useQuizTimer(options: UseQuizTimerOptions): UseQuizTimerResult {
  const {
    initialTime,
    onExpire,
    onTick,
    autoStart = false,
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  
  // Use refs to avoid stale closures in interval callback
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  
  // Ref to track latest timeRemaining for start function (avoid stale closure)
  const timeRemainingRef = useRef(timeRemaining);
  const isExpiredRef = useRef(isExpired);

  // Update refs when callbacks change
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Keep refs in sync with state
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    isExpiredRef.current = isExpired;
  }, [isExpired]);

  /**
   * Clear the interval
   */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Start the timer
   * Uses refs to get latest values and avoid stale closure issues
   */
  const start = useCallback(() => {
    if (isExpiredRef.current || timeRemainingRef.current <= 0) {
      return;
    }
    setIsRunning(true);
  }, []);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  /**
   * Reset the timer to initial time or a new time
   * Updates refs immediately to ensure start() works correctly after reset
   */
  const reset = useCallback((newTime?: number) => {
    clearTimer();
    const resetTime = newTime ?? initialTime;
    // Update refs immediately (before state updates) so start() can use them
    timeRemainingRef.current = resetTime;
    isExpiredRef.current = false;
    setTimeRemaining(resetTime);
    setIsRunning(false);
    setIsExpired(false);
  }, [clearTimer, initialTime]);

  /**
   * Handle timer tick
   */
  useEffect(() => {
    if (!isRunning || isExpired) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Call onTick callback
        if (onTickRef.current) {
          onTickRef.current(newTime);
        }

        // Check if timer has expired
        if (newTime <= 0) {
          setIsRunning(false);
          setIsExpired(true);
          
          // Call onExpire callback
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [isRunning, isExpired, clearTimer]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  /**
   * Format the time for display
   */
  const formattedTime = formatTime(timeRemaining);

  return {
    timeRemaining,
    isRunning,
    isExpired,
    start,
    pause,
    reset,
    formattedTime,
  };
}
