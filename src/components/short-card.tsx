import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/theme';
import type { Video } from '@/types';

type Props = {
  video: Video;
  height: number;
  onPress: (video: Video) => void;
};

/** Full-screen, swipe-to-next card for the Shorts feed. No like/comment/share
 * affordances — FocusTube's own UI never surfaces those. */
export function ShortCard({ video, height, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(video)} style={[styles.container, { height }]}>
      <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <View style={styles.overlay}>
        <ChannelAvatar uri={video.channelThumbnailUrl} size={32} />
        <View style={styles.textColumn}>
          <ThemedText numberOfLines={2} style={styles.title}>
            {video.title}
          </ThemedText>
          <ThemedText type="caption" color="textSecondary">
            {video.channelName}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'flex-end',
  },
  overlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.four,
    backgroundColor: Colors.overlay,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: '600',
  },
});
