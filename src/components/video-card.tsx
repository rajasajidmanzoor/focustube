import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { DurationBadge } from '@/components/duration-badge';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';
import type { Video } from '@/types';
import { formatRelativeTime } from '@/utils';

type Props = {
  video: Video;
  onPress: (video: Video) => void;
};

export function VideoCard({ video, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(video)} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.thumbnailWrapper}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" transition={150} />
        <DurationBadge seconds={video.durationSeconds} />
      </View>
      <View style={styles.meta}>
        <ChannelAvatar uri={video.channelThumbnailUrl} />
        <View style={styles.textColumn}>
          <ThemedText numberOfLines={2} style={styles.title}>
            {video.title}
          </ThemedText>
          <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
            {video.channelName} • {formatRelativeTime(video.publishedAt)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  pressed: {
    opacity: 0.85,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.medium,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
});
