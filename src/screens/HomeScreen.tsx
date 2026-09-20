import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { useHomeFeed } from '@/hooks';
import { Colors, Spacing } from '@/theme';
import type { Video } from '@/types';

function openVideo(video: Video) {
  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } });
}

export function HomeScreen() {
  const { state, refreshing, refetch, refresh } = useHomeFeed();

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="FocusTube" />

      {state.status === 'loading' && <LoadingState label="Loading your feed…" />}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={refetch} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyState
          icon="home-outline"
          title="No videos yet"
          description="Add a channel to see its uploads here."
          actionLabel="Go to Channels"
          onAction={() => router.push('/channels')}
        />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <FlatList
          data={state.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} onPress={openVideo} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
