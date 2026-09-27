import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Colors } from '@/theme';

export type ShortsPlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

const STATE_BY_CODE: Record<number, ShortsPlayerState> = {
  [-1]: 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'cued',
};

// Error codes per https://developers.google.com/youtube/iframe_api_reference#Events
const UNAVAILABLE_ERROR_CODES = new Set([100, 101, 150]);

const LOAD_TIMEOUT_MS = 15000;
const PROGRESS_POLL_INTERVAL_MS = 5000;

// A real, publicly hosted page that embeds the YouTube IFrame Player API — using a
// genuine hosted origin (not local HTML pretending to be one) is what makes
// `enablejsapi`-style origin validation pass normally, the same way it does for any
// website that embeds a YouTube video. Same page react-native-youtube-iframe uses.
const PLAYER_HOST_URL = 'https://lonelycpp.github.io/react-native-youtube-iframe/iframe_v2.html';

function buildEmbedUrl(videoId: string): string {
  const data = {
    videoId_s: videoId,
    rel_s: 0,
    loop_s: 0,
    controls_s: 1,
    contentScale_s: 1,
    cc_lang_pref_s: '',
    allowWebViewZoom: false,
    modestbranding_s: 0,
    preventFullScreen_s: 1,
    showClosedCaptions_s: 0,
  };
  return `${PLAYER_HOST_URL}?data=${encodeURI(JSON.stringify(data))}`;
}

// Blocks the WebView from ever navigating its top frame away from our own wrapper
// page — without this, YouTube's own "expand" control can drive the page to a full
// youtube.com watch page (comments, likes, subscribe, related videos), which must
// never appear inside FocusTube's own UI. Subframe navigations (the actual YouTube
// iframe loading) are always allowed, since blocking those breaks playback.
function shouldAllowNavigation(request: { url: string; isTopFrame: boolean }): boolean {
  if (!request.isTopFrame) return true;
  return request.url.startsWith(PLAYER_HOST_URL);
}

// The hosted page's video box already fills its own body (`html,body{height:100%}`),
// but our WebView sizes that body from `width`/`height` args passed into `YT.Player`,
// which the page hardcodes to 1000x1000 — this restyles it to fill whatever real size
// we gave the WebView instead. Doesn't touch YouTube's own iframe/DOM/controls.
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

type PlayerMessage =
  | { eventType: 'playerReady' }
  | { eventType: 'playerError'; data: number }
  | { eventType: 'playerStateChange'; data: number }
  | { eventType: 'ftProgress'; data: { currentTime: number; duration: number } };

type Props = {
  videoId: string;
  /** Whether this Short should be playing right now. Every other card in the feed
   * must be `false` — only one Short plays (with sound) at a time. */
  isActive: boolean;
  onStateChange?: (state: ShortsPlayerState) => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

/**
 * A YouTube player built specifically for the Shorts feed: full-bleed, autoplay-on-
 * active, and driven directly (not through `react-native-youtube-iframe`'s own
 * postMessage-based command relay, which proved unreliable on real devices — commands
 * are executed directly in the page via `injectJavaScript` instead, which doesn't
 * depend on the page's `window.addEventListener('message', ...)` handler at all).
 *
 * Renders YouTube's own unmodified embedded player — same origin-validated hosted
 * page as the single-video screen's player. Never touches the player's DOM, CSS, or
 * controls beyond making the video box fill its container. No media is downloaded,
 * extracted, or proxied.
 */
export function ShortsPlayer({ videoId, isActive, onStateChange, onProgress }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const hasUnmutedRef = useRef(false);

  const embedUrl = useMemo(() => buildEmbedUrl(videoId), [videoId]);

  const runInPlayer = useCallback((script: string) => {
    webViewRef.current?.injectJavaScript(`if (window.player) { ${script} } true;`);
  }, []);

  // Browsers only reliably allow autoplay that *starts* muted — an unmuted `play()`
  // with no real touch gesture behind it is routinely blocked. So becoming active
  // always starts muted and unmutes itself the instant real playback is observed
  // (see the 'playing' case below), instead of waiting on a tap.
  const applyActiveState = useCallback(
    (active: boolean) => {
      if (active) {
        hasUnmutedRef.current = false;
        runInPlayer('player.mute(); player.playVideo();');
      } else {
        runInPlayer('player.pauseVideo(); player.mute();');
      }
    },
    [runInPlayer],
  );

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isReadyRef.current) applyActiveState(isActive);
  }, [isActive, applyActiveState]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!isActive || status !== 'ready' || !onProgress) return;
    const interval = setInterval(() => {
      runInPlayer(
        'window.ReactNativeWebView.postMessage(JSON.stringify({eventType:"ftProgress",' +
          'data:{currentTime: player.getCurrentTime(), duration: player.getDuration()}}));',
      );
    }, PROGRESS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isActive, status, onProgress, runInPlayer]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: PlayerMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as PlayerMessage;
      } catch {
        return;
      }

      if (message.eventType === 'playerReady') {
        isReadyRef.current = true;
        setStatus('ready');
        applyActiveState(isActiveRef.current);
      } else if (message.eventType === 'playerError') {
        if (UNAVAILABLE_ERROR_CODES.has(message.data)) setStatus('error');
      } else if (message.eventType === 'playerStateChange') {
        const mapped = STATE_BY_CODE[message.data] ?? 'unstarted';
        if (mapped === 'playing' && isActiveRef.current && !hasUnmutedRef.current) {
          hasUnmutedRef.current = true;
          runInPlayer('player.unMute();');
        }
        if (mapped === 'ended' && isActiveRef.current) {
          // This Short repeats while it's the one being watched, matching real
          // YouTube Shorts — advancing to the next one is the user's own swipe.
          runInPlayer('player.seekTo(0, true); player.playVideo();');
        }
        onStateChange?.(mapped);
      } else if (message.eventType === 'ftProgress') {
        onProgress?.(message.data.currentTime, message.data.duration);
      }
    },
    [applyActiveState, onStateChange, onProgress, runInPlayer],
  );

  const handleLoadFailure = useCallback(() => setStatus('error'), []);

  const handleRetry = useCallback(() => {
    isReadyRef.current = false;
    hasUnmutedRef.current = false;
    setStatus('loading');
    webViewRef.current?.reload();
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {status === 'error' ? (
        <ErrorState message="This video couldn't be played." onRetry={handleRetry} />
      ) : (
        <>
          {size.width > 0 && size.height > 0 && (
            <WebView
              ref={webViewRef}
              source={{ uri: embedUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={FILL_CSS_JS}
              onShouldStartLoadWithRequest={shouldAllowNavigation}
              onMessage={handleMessage}
              onError={handleLoadFailure}
              onHttpError={handleLoadFailure}
              // This WebView covers the entire swipeable card, so its own native
              // scroll/pan handling would otherwise swallow the vertical swipe
              // before the surrounding FlatList ever sees it — the video itself
              // never needs to scroll, so this is safe to turn off.
              scrollEnabled={false}
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
    flex: 1,
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
