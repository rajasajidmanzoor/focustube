import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { DurationBadge } from '@/components/duration-badge';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockVideos } from '@/services/youtube/mockData';
import { Colors, Spacing } from '@/theme';
import { formatRelativeTime } from '@/utils';

export function VideoPlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const video = mockVideos.find((item) => item.id === videoId);

  if (!video) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Video not found"
          description="This video is no longer available."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Placeholder for the real embedded YouTube player (TODO.md Phase 7) — shows
          the thumbnail with a play affordance, no playback yet. */}
      <View style={styles.playerPlaceholder}>
        <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, styles.playOverlay]}>
          <Ionicons name="play-circle" size={64} color={Colors.text} />
        </View>
        <DurationBadge seconds={video.durationSeconds} />
      </View>

      <View style={styles.info}>
        <ThemedText type="subtitle">{video.title}</ThemedText>
        <View style={styles.channelRow}>
          <ChannelAvatar uri={video.channelThumbnailUrl} />
          <View>
            <ThemedText>{video.channelName}</ThemedText>
            <ThemedText type="caption" color="textSecondary">
              {formatRelativeTime(video.publishedAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.overlay,
  },
  info: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
