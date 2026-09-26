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

// The hosted player page (react-native-youtube-iframe's iframe_v2.html) hardcodes its
// video box to a 16:9 shape via a `padding-bottom: 56.25%` trick, so a vertical Shorts
// card would otherwise get a small pillarboxed video instead of filling the screen.
// This restyles that one box to fill whatever size we actually gave the WebView —
// it doesn't touch YouTube's own iframe/controls, just the wrapper page's CSS.
const FILL_CSS_JS = `
(function () {
  var style = document.createElement('style');
  style.textContent = 'html,body{height:100%!important;margin:0!important}' +
    '.container{height:100%!important;padding-bottom:0!important}' +
    '.video{width:100%!important;height:100%!important}';
  document.head.appendChild(style);
  true;
})();
`;

type Props = {
  videoId: string;
  onStateChange?: (state: YouTubePlayerState) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  /** Fills the parent's measured size instead of a fixed 16:9 box — for the Shorts
   * feed, where each card is already a fixed-size vertical slot. */
  fill?: boolean;
  /** Loops the single video instead of stopping at `onStateChange('ended')`. */
  loop?: boolean;
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
 */
export function YouTubePlayer({ videoId, onStateChange, onProgress, fill = false, loop = false }: Props) {
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
  const playerHeight = fill ? size.height : (size.width * 9) / 16;

  return (
    <View style={[styles.container, fill && styles.fill]} onLayout={handleLayout}>
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
              forceAndroidAutoplay
              playList={loop ? [videoId] : undefined}
              initialPlayerParams={loop ? { loop: true } : undefined}
              onReady={handleReady}
              onError={handleError}
              onChangeState={handleChangeState}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                injectedJavaScript: fill ? FILL_CSS_JS : undefined,
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
  fill: {
    flex: 1,
    aspectRatio: undefined,
  },
  loadingOverlay: {
    backgroundColor: Colors.background,
  },
});
