import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import YoutubeIframe, { type YoutubeIframeRef } from 'react-native-youtube-iframe';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Colors } from '@/theme';

export type YouTubePlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

const UNAVAILABLE_ERRORS = new Set(['video_not_found', 'embed_not_allowed', 'invalid_parameter']);

const LOAD_TIMEOUT_MS = 15000;
const PROGRESS_POLL_INTERVAL_MS = 5000;

// The wrapper page react-native-youtube-iframe hosts the player on. Must match the
// library's own default (we never pass baseUrlOverride).
const PLAYER_HOST_URL = 'https://lonelycpp.github.io/react-native-youtube-iframe/iframe_v2.html';

// The library's own navigation guard checks `mainDocumentURL`, which doesn't change
// when the *nested* YouTube iframe navigates itself (e.g. its own fullscreen/expand
// control driving `window.top.location` to a full youtube.com watch page) — so that
// guard never fires for exactly the case that matters. This checks the real target
// of top-frame navigations instead, and blocks anything that isn't our own wrapper
// page, so the WebView can never replace our minimal player with YouTube's full site
// UI (comments, likes, subscribe, related videos) — those must never appear in
// FocusTube's own UI. Subframe navigations (the actual YouTube iframe loading) are
// always allowed, since blocking those would break playback itself.
function shouldAllowNavigation(request: { url: string; isTopFrame: boolean }): boolean {
  if (!request.isTopFrame) return true;
  return request.url.startsWith(PLAYER_HOST_URL);
}

type Props = {
  videoId: string;
  onStateChange?: (state: YouTubePlayerState) => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

/**
 * Renders YouTube's own embedded player via `react-native-youtube-iframe` — a
 * WebView wrapper around YouTube's IFrame Player API. The library loads a real,
 * publicly hosted page (not local HTML pretending to have a youtube.com origin) that
 * embeds the YouTube iframe, so origin validation for the JS API passes normally,
 * the same way it would for any website that embeds a YouTube video.
 *
 * This never touches the player's DOM, CSS, or controls: everything the user sees
 * is YouTube's own unmodified UI, including its own error/unavailable screens. No
 * media is downloaded, extracted, or proxied.
 *
 * Used for the single-video screen only — the Shorts feed uses its own dedicated
 * `ShortsPlayer`, which needs a fundamentally different playback model (autoplay,
 * one-at-a-time active/paused control across a swipeable list).
 */
export function YouTubePlayer({ videoId, onStateChange, onProgress }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const playerRef = useRef<YoutubeIframeRef | null>(null);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, reloadKey]);

  useEffect(() => {
    if (status !== 'ready') return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !onProgress) return;
      Promise.all([player.getCurrentTime(), player.getDuration()])
        .then(([currentTime, duration]) => onProgress(currentTime, duration))
        .catch(() => {});
    }, PROGRESS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, onProgress]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const handleReady = useCallback(() => setStatus('ready'), []);

  const handleError = useCallback((error: string) => {
    if (UNAVAILABLE_ERRORS.has(error)) setStatus('error');
  }, []);

  const handleChangeState = useCallback(
    (state: string) => {
      onStateChange?.(state === 'video cued' ? 'cued' : (state as YouTubePlayerState));
    },
    [onStateChange],
  );

  const handleRetry = useCallback(() => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  }, []);

  const playerWidth = size.width;
  const playerHeight = (size.width * 9) / 16;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {status === 'error' ? (
        <ErrorState message="This video couldn't be played." onRetry={handleRetry} />
      ) : (
        <>
          {playerWidth > 0 && playerHeight > 0 && (
            <YoutubeIframe
              key={reloadKey}
              ref={playerRef}
              videoId={videoId}
              width={playerWidth}
              height={playerHeight}
              play
              onReady={handleReady}
              onError={handleError}
              onChangeState={handleChangeState}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                onShouldStartLoadWithRequest: shouldAllowNavigation,
              }}
            />
          )}
          {status === 'loading' && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <LoadingState label="Loading player…" />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    backgroundColor: Colors.background,
  },
});
