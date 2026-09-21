import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type LayoutChangeEvent, StyleSheet, type ViewToken } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ShortCard } from '@/components/short-card';
import { ShortsLimitCard } from '@/components/shorts-limit-card';
import { ThemedView } from '@/components/themed-view';
import { useSettings, useShortsFeed } from '@/hooks';
import type { Video } from '@/types';

function openVideo(video: Video) {
  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } });
}

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

type ShortsListItem = { kind: 'video'; video: Video } | { kind: 'limit' };

export function ShortsScreen() {
  const { settings } = useSettings();
  const { state, hasChannels, isSyncing, refetch } = useShortsFeed();
  const [containerHeight, setContainerHeight] = useState(0);
  // "Continue Anyway" lifts the cap for the rest of this Shorts tab visit — resets
  // (a fresh session) whenever the screen remounts.
  const [overrideLimit, setOverrideLimit] = useState(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const videos = useMemo(() => (state.status === 'success' ? state.data : []), [state]);

  const sessionLimit = settings.maxShortsPerSession === 'unlimited' ? null : settings.maxShortsPerSession;

  // Once the session limit is reached, the next swipe lands on the limit card
  // instead of another Short — never on unrelated/recommended content, and never
  // introducing channels the user hasn't approved (it's just a stop, not a feed).
  const listData = useMemo<ShortsListItem[]>(() => {
    if (sessionLimit == null || overrideLimit || videos.length <= sessionLimit) {
      return videos.map((video) => ({ kind: 'video', video }));
    }
    return [
      ...videos.slice(0, sessionLimit).map((video): ShortsListItem => ({ kind: 'video', video })),
      { kind: 'limit' },
    ];
  }, [videos, sessionLimit, overrideLimit]);

  // Preloads the thumbnail immediately before/after the current Short so swiping
  // forward or back stays smooth — metadata itself is already all in memory (the
  // whole synced feed loads at once from SQLite, no per-item network fetch needed).
  const listDataRef = useRef<ShortsListItem[]>([]);
  useEffect(() => {
    listDataRef.current = listData;
  }, [listData]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const centerIndex = viewableItems[0]?.index;
    if (centerIndex == null) return;
    const currentItems = listDataRef.current;
    for (const neighborIndex of [centerIndex - 1, centerIndex + 1]) {
      const item = currentItems[neighborIndex];
      if (item?.kind === 'video') void Image.prefetch(item.video.thumbnailUrl);
    }
  }, []);

  const handleBackToVideos = useCallback(() => router.push('/'), []);
  const handleContinueAnyway = useCallback(() => setOverrideLimit(true), []);

  if (settings.hideShorts) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="flash-off-outline"
          title="Shorts is hidden"
          description="Turn off &ldquo;Hide Shorts&rdquo; in Settings to see short-form videos here."
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

      {state.status === 'success' && listData.length > 0 && containerHeight > 0 && (
        <FlatList
          data={listData}
          keyExtractor={(item) => (item.kind === 'limit' ? 'limit-sentinel' : item.video.id)}
          renderItem={({ item }) =>
            item.kind === 'limit' ? (
              <ShortsLimitCard
                height={containerHeight}
                onBackToVideos={handleBackToVideos}
                onContinueAnyway={handleContinueAnyway}
              />
            ) : (
              <ShortCard video={item.video} height={containerHeight} onPress={openVideo} />
            )
          }
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
