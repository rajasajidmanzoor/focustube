import { useCallback, useEffect, useRef } from 'react';

import { markWatchCompleted, recordWatchStart, updateWatchProgress } from '@/services/database';
import type { Video } from '@/types';
import type { YouTubePlayerState } from '@/components/youtube-player';

const PROGRESS_WRITE_INTERVAL_MS = 5000;

/** Bridges YouTubePlayer's onStateChange/onProgress callbacks to watch_history:
 * records a session the first time playback starts, throttles progress writes to
 * avoid hammering SQLite every second, and marks the video completed when it ends. */
export function useWatchProgress(video: Video | null) {
  const hasStartedRef = useRef(false);
  const lastWriteRef = useRef(0);

  // Callers that keep a single hook instance alive across several videos (e.g. the
  // Shorts feed swapping which video is "active") need these per-video trackers to
  // reset whenever the video itself changes — otherwise a later video would never
  // get its own recordWatchStart call.
  useEffect(() => {
    hasStartedRef.current = false;
    lastWriteRef.current = 0;
  }, [video?.id]);

  const handleStateChange = useCallback(
    (state: YouTubePlayerState) => {
      if (!video) return;

      if (state === 'playing' && !hasStartedRef.current) {
        hasStartedRef.current = true;
        void recordWatchStart(video);
      }
      if (state === 'ended') {
        void markWatchCompleted(video.id);
      }
    },
    [video],
  );

  const handleProgress = useCallback(
    (currentTime: number) => {
      if (!video || !hasStartedRef.current) return;

      const now = Date.now();
      if (now - lastWriteRef.current < PROGRESS_WRITE_INTERVAL_MS) return;
      lastWriteRef.current = now;
      void updateWatchProgress(video.id, currentTime);
    },
    [video],
  );

  return { handleStateChange, handleProgress };
}
