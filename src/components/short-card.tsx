import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { ShortsPlayer, type ShortsPlayerState } from '@/components/shorts-player';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/theme';
import type { Video } from '@/types';

type Props = {
  video: Video;
  height: number;
  onPress: (video: Video) => void;
  /** Whether this card is the one currently centered on screen — playing, with
   * sound, the one whose state/progress we forward to watch history. */
  isActive?: boolean;
  /** Whether this card is within the swipe-ahead window: mounted and loading (or
   * already loaded, paused and muted) so swiping to it is instant instead of
   * starting a fresh WebView load at that moment. */
  isPreloaded?: boolean;
  onStateChange?: (state: ShortsPlayerState) => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

const SCRIM_STEPS = 6;
const SCRIM_BANDS = Array.from({ length: SCRIM_STEPS }, (_, index) => (index + 1) / SCRIM_STEPS);

/** Approximates a bottom gradient scrim with stacked semi-transparent bands (no
 * gradient library needed) — purely functional, for text legibility over the
 * thumbnail, not decorative. */
function ReadabilityScrim() {
  return (
    <View style={styles.scrim} pointerEvents="none">
      {SCRIM_BANDS.map((opacity) => (
        <View key={opacity} style={[styles.scrimBand, { opacity }]} />
      ))}
    </View>
  );
}

/** Full-screen, swipe-to-next card for the Shorts feed. No like/comment/share
 * affordances — FocusTube's own UI never surfaces those. */
export function ShortCard({
  video,
  height,
  onPress,
  isActive = false,
  isPreloaded = false,
  onStateChange,
  onProgress,
}: Props) {
  if (isActive || isPreloaded) {
    // No Pressable/overlay here: YouTube's own controls (play/pause, volume, etc.)
    // must stay reachable and untouched, so nothing of ours sits on top of the
    // player — matches the same rule VideoPlayerScreen's player already follows.
    // A preloaded (not-yet-active) card mounts its player early but stays paused
    // and muted (ShortsPlayer enforces this itself) — nothing plays or makes sound
    // until it actually becomes active.
    return (
      <View style={[styles.container, { height }]}>
        <ShortsPlayer
          videoId={video.id}
          isActive={isActive}
          onStateChange={isActive ? onStateChange : undefined}
          onProgress={isActive ? onProgress : undefined}
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(video)}
      style={[styles.container, { height }]}
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${video.channelName}`}>
      <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <ReadabilityScrim />
      <View style={styles.content}>
        <ChannelAvatar uri={video.channelThumbnailUrl} size={32} />
        <View style={styles.textColumn}>
          <ThemedText numberOfLines={2} style={styles.title}>
            {video.title}
          </ThemedText>
          <ThemedText type="caption" color="textSecondary" style={styles.channel}>
            {video.channelName}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const SCRIM_HEIGHT = 220;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCRIM_HEIGHT,
    flexDirection: 'column',
  },
  scrimBand: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  channel: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
