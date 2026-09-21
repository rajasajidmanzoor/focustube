import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { YouTubePlayer } from '@/components/youtube-player';
import { useWatchProgress } from '@/hooks';
import { getCachedVideoById } from '@/services/database';
import { Spacing } from '@/theme';
import type { Video } from '@/types';
import { formatRelativeTime } from '@/utils';

type LookupState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not_found' }
  | { status: 'success'; video: Video };

export function VideoPlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const [lookup, setLookup] = useState<LookupState>({ status: 'loading' });

  // No synchronous setState here (safe to call directly from the mount effect) — the
  // initial `useState({ status: 'loading' })` above already covers the first render.
  const fetchVideo = useCallback(() => {
    let cancelled = false;

    getCachedVideoById(videoId)
      .then((cached) => {
        if (cancelled) return;
        setLookup(cached ? { status: 'success', video: cached } : { status: 'not_found' });
      })
      .catch(() => {
        if (!cancelled) setLookup({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => fetchVideo(), [fetchVideo]);

  const retry = useCallback(() => {
    setLookup({ status: 'loading' });
    fetchVideo();
  }, [fetchVideo]);

  const video = lookup.status === 'success' ? lookup.video : null;
  const { handleStateChange, handleProgress } = useWatchProgress(video);

  if (lookup.status === 'loading') {
    return (
      <ThemedView style={styles.container}>
        <LoadingState label="Loading video…" />
      </ThemedView>
    );
  }

  if (lookup.status === 'error') {
    return (
      <ThemedView style={styles.container}>
        <ErrorState message="Couldn't load this video. Check your connection and try again." onRetry={retry} />
      </ThemedView>
    );
  }

  if (lookup.status === 'not_found') {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Video not found"
          description="This video isn't in your feed, or is no longer available."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <YouTubePlayer videoId={lookup.video.id} onStateChange={handleStateChange} onProgress={handleProgress} />

      <View style={styles.info}>
        <ThemedText type="subtitle">{lookup.video.title}</ThemedText>
        <View style={styles.channelRow}>
          <ChannelAvatar uri={lookup.video.channelThumbnailUrl} />
          <View>
            <ThemedText>{lookup.video.channelName}</ThemedText>
            <ThemedText type="caption" color="textSecondary">
              {formatRelativeTime(lookup.video.publishedAt)}
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
