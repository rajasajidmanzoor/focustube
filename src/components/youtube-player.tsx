import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Colors } from '@/theme';

export type YouTubePlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

const STATE_BY_CODE: Record<number, YouTubePlayerState> = {
  [-1]: 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'cued',
};

// YouTube IFrame Player API error codes — see
// https://developers.google.com/youtube/iframe_api_reference#Events
const UNAVAILABLE_ERROR_CODES = new Set([100, 101, 150]);

const LOAD_TIMEOUT_MS = 15000;

type PlayerMessage =
  | { type: 'ready' }
  | { type: 'error'; data: number }
  | { type: 'stateChange'; data: number }
  | { type: 'progress'; data: { currentTime: number; duration: number } };

type Props = {
  videoId: string;
  onStateChange?: (state: YouTubePlayerState) => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

/**
 * Renders YouTube's own IFrame Player — the currently-supported embedded playback
 * mechanism — inside a WebView, and listens to its documented JS events
 * (onReady/onStateChange/onError) to know when playback starts/progresses/ends.
 *
 * This never touches the player's DOM, CSS, or controls: everything the user sees
 * inside the WebView is YouTube's own unmodified UI. Our own loading/error views
 * only ever *replace* the WebView (before it's ready, or if it fails) — they never
 * render on top of it. No media is downloaded, extracted, or proxied; the WebView
 * simply loads a page that embeds YouTube's own player, exactly like a browser would.
 *
 * Kept isolated behind this component's props (videoId + a couple of callbacks) so
 * the underlying playback mechanism can be swapped later without touching any
 * screen that renders it.
 */
export function YouTubePlayer({ videoId, onStateChange, onProgress }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  const html = buildPlayerHtml(videoId);

  // Covers "player loading failure" cases where neither onReady nor a WebView
  // navigation error ever fires (e.g. the iframe API script silently fails).
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, reloadKey]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: PlayerMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as PlayerMessage;
      } catch {
        return;
      }

      if (message.type === 'ready') {
        setStatus('ready');
      } else if (message.type === 'error') {
        // Only "video unavailable" style errors (removed/private/embedding
        // disallowed) replace the whole player with our error state — other codes
        // (e.g. a transient 2/5) aren't necessarily fatal, so we leave YouTube's own
        // player showing whatever it renders for them.
        if (UNAVAILABLE_ERROR_CODES.has(message.data)) {
          setStatus('error');
        }
      } else if (message.type === 'stateChange') {
        onStateChange?.(STATE_BY_CODE[message.data] ?? 'unstarted');
      } else if (message.type === 'progress') {
        onProgress?.(message.data.currentTime, message.data.duration);
      }
    },
    [onStateChange, onProgress],
  );

  const handleRetry = useCallback(() => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  }, []);

  const handleLoadFailure = useCallback(() => setStatus('error'), []);

  return (
    <View style={styles.container}>
      {status === 'error' ? (
        <ErrorState message="This video couldn't be played." onRetry={handleRetry} />
      ) : (
        <>
          <WebView
            key={reloadKey}
            // baseUrl matters: without a real https:// origin, YouTube's IFrame API
            // rejects playback (its own "Error 153 / configuration error" screen) —
            // inline HTML otherwise loads with no usable origin for it to check.
            source={{ html, baseUrl: 'https://www.youtube.com' }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['https://www.youtube.com', 'about:blank']}
            onMessage={handleMessage}
            onError={handleLoadFailure}
            onHttpError={handleLoadFailure}
          />
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

function buildPlayerHtml(videoId: string): string {
  const safeVideoId = JSON.stringify(videoId);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
    #player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    function post(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data === undefined ? null : data }));
      }
    }

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    var progressTimer;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: ${safeVideoId},
        playerVars: { playsinline: 1 },
        events: {
          onReady: function () {
            post('ready');
            progressTimer = setInterval(function () {
              if (player && player.getCurrentTime && player.getDuration) {
                var duration = player.getDuration();
                if (duration > 0) {
                  post('progress', { currentTime: player.getCurrentTime(), duration: duration });
                }
              }
            }, 1000);
          },
          onError: function (event) { post('error', event.data); },
          onStateChange: function (event) { post('stateChange', event.data); }
        }
      });
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    backgroundColor: Colors.background,
  },
});
