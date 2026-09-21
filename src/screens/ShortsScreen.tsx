import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type LayoutChangeEvent, StyleSheet, type ViewToken } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ShortCard } from '@/components/short-card';
import { ThemedView } from '@/components/themed-view';
import { useSettings, useShortsFeed } from '@/hooks';
import type { Video } from '@/types';

function openVideo(video: Video) {
  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } });
}

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

export function ShortsScreen() {
  const { settings } = useSettings();
  const { state, hasChannels, isSyncing, refetch } = useShortsFeed();
  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const videos = useMemo(() => (state.status === 'success' ? state.data : []), [state]);

  // Preloads the thumbnail immediately before/after the current Short so swiping
  // forward or back stays smooth — metadata itself is already all in memory (the
  // whole synced feed loads at once from SQLite, no per-item network fetch needed).
  const videosRef = useRef<Video[]>([]);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const centerIndex = viewableItems[0]?.index;
    if (centerIndex == null) return;
    const currentVideos = videosRef.current;
    for (const neighborIndex of [centerIndex - 1, centerIndex + 1]) {
      const uri = currentVideos[neighborIndex]?.thumbnailUrl;
      if (uri) void Image.prefetch(uri);
    }
  }, []);

  if (!settings.shortsEnabled) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="flash-off-outline"
          title="Shorts is turned off"
          description="Turn Shorts back on in Settings to see short-form videos here."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} onLayout={onLayout}>
      {state.status === 'loading' && <LoadingState label="Loading Shorts…" />}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={refetch} />}

      {state.status === 'success' && videos.length === 0 && !hasChannels && (
        <EmptyState
          icon="people-outline"
          title="No channels yet"
          description="Add a channel to see its Shorts here."
        />
      )}

      {state.status === 'success' && videos.length === 0 && hasChannels && isSyncing && (
        <LoadingState label="Syncing your channels…" />
      )}

      {state.status === 'success' && videos.length === 0 && hasChannels && !isSyncing && (
        <EmptyState
          icon="flash-outline"
          title="No Shorts yet"
          description="Your approved channels haven't posted any Shorts yet."
        />
      )}

      {state.status === 'success' && videos.length > 0 && containerHeight > 0 && (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ShortCard video={item} height={containerHeight} onPress={openVideo} />}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={containerHeight}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: containerHeight, offset: containerHeight * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
