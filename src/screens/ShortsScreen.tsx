import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, type LayoutChangeEvent, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ShortCard } from '@/components/short-card';
import { ThemedView } from '@/components/themed-view';
import { useShortsFeed } from '@/hooks';
import type { Video } from '@/types';

function openVideo(video: Video) {
  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } });
}

export function ShortsScreen() {
  const { state, refetch } = useShortsFeed();
  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <ThemedView style={styles.container} onLayout={onLayout}>
      {state.status === 'loading' && <LoadingState label="Loading Shorts…" />}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={refetch} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyState
          icon="flash-outline"
          title="No Shorts yet"
          description="Short-form uploads from your channels will appear here."
        />
      )}
      {state.status === 'success' && state.data.length > 0 && containerHeight > 0 && (
        <FlatList
          data={state.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ShortCard video={item} height={containerHeight} onPress={openVideo} />}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={containerHeight}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: containerHeight, offset: containerHeight * index, index })}
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
