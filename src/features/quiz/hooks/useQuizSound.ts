/**
 * useQuizSound Hook
 * Manages audio feedback for quiz interactions
 * Requirements: 5.4, 5.5
 */

import { useCallback, useRef, useState, useEffect } from 'react';

// Sound file paths
const SOUND_PATHS = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  warning: '/sounds/warning.mp3',
  timeup: '/sounds/timeup.mp3',
  complete: '/sounds/complete.mp3',
} as const;

type SoundType = keyof typeof SOUND_PATHS;

export interface UseQuizSoundOptions {
  /** Initial muted state */
  initialMuted?: boolean;
  /** Volume level (0-1) */
  volume?: number;
}

export interface UseQuizSoundResult {
  /** Play correct answer sound */
  playCorrect: () => void;
  /** Play incorrect answer sound */
  playIncorrect: () => void;
  /** Play timer warning sound */
  playTimeWarning: () => void;
  /** Play time up sound */
  playTimeUp: () => void;
  /** Play quiz completion sound */
  playComplete: () => void;
  /** Set muted state */
  setMuted: (muted: boolean) => void;
  /** Toggle muted state */
  toggleMuted: () => void;
  /** Current muted state */
  isMuted: boolean;
  /** Set volume level */
  setVolume: (volume: number) => void;
  /** Current volume level */
  volume: number;
}

/**
 * Hook for managing quiz sound effects
 * Provides functions to play various feedback sounds with mute control
 */
export function useQuizSound(options: UseQuizSoundOptions = {}): UseQuizSoundResult {
  const { initialMuted = false, volume: initialVolume = 0.5 } = options;

  const [isMuted, setIsMuted] = useState(() => {
    // Try to restore muted state from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quiz-sound-muted');
      return stored ? stored === 'true' : initialMuted;
    }
    return initialMuted;
  });

  const [volume, setVolumeState] = useState(() => {
    // Try to restore volume from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quiz-sound-volume');
      return stored ? parseFloat(stored) : initialVolume;
    }
    return initialVolume;
  });

  // Audio element refs for each sound type
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Preload audio files
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentAudioRefs = audioRefs.current;

    Object.entries(SOUND_PATHS).forEach(([type, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = volume;
      currentAudioRefs.set(type as SoundType, audio);
    });

    return () => {
      // Cleanup audio elements
      currentAudioRefs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      currentAudioRefs.clear();
    };
  }, [volume]);

  // Update volume on all audio elements when volume changes
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = volume;
    });
    // Persist volume to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz-sound-volume', volume.toString());
    }
  }, [volume]);

  // Persist muted state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz-sound-muted', isMuted.toString());
    }
  }, [isMuted]);

  /**
   * Play a sound by type
   */
  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      const audio = audioRefs.current.get(type);
      if (audio) {
        // Reset to start if already playing
        audio.currentTime = 0;
        audio.play().catch((error) => {
          // Silently handle autoplay restrictions
          console.debug(`Could not play ${type} sound:`, error.message);
        });
      }
    },
    [isMuted]
  );

  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playIncorrect = useCallback(() => playSound('incorrect'), [playSound]);
  const playTimeWarning = useCallback(() => playSound('warning'), [playSound]);
  const playTimeUp = useCallback(() => playSound('timeup'), [playSound]);
  const playComplete = useCallback(() => playSound('complete'), [playSound]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

  return {
    playCorrect,
    playIncorrect,
    playTimeWarning,
    playTimeUp,
    playComplete,
    setMuted,
    toggleMuted,
    isMuted,
    setVolume,
    volume,
  };
}

export default useQuizSound;
