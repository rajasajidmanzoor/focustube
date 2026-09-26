import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { VideoCardSkeleton } from '@/components/video-card-skeleton';
import { useHomeFeed } from '@/hooks';
import { Colors, Spacing } from '@/theme';
import type { Video } from '@/types';
import { formatRelativeTime } from '@/utils';

const SKELETON_CARDS = [0, 1, 2];

function openVideo(video: Video) {
  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } });
}

export function HomeScreen() {
  const { state, refreshing, refetch, refresh, hasChannels, isSyncing, lastUpdatedAt } = useHomeFeed();

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="FocusTube" />

      {state.status === 'loading' && (
        <View style={styles.list} accessibilityLabel="Loading your feed">
          {SKELETON_CARDS.map((key) => (
            <VideoCardSkeleton key={key} />
          ))}
        </View>
      )}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={refetch} />}

      {state.status === 'success' && state.data.length === 0 && !hasChannels && (
        <EmptyState
          icon="home-outline"
          title="No channels yet"
          description="Add a channel to see its uploads here."
          actionLabel="Go to Channels"
          onAction={() => router.push('/channels')}
        />
      )}

      {state.status === 'success' && state.data.length === 0 && hasChannels && isSyncing && (
        <LoadingState label="Syncing your channels…" />
      )}

      {state.status === 'success' && state.data.length === 0 && hasChannels && !isSyncing && (
        <EmptyState
          icon="videocam-outline"
          title="No videos yet"
          description="Your approved channels haven't posted anything yet, or the first sync hasn't run. Pull to refresh."
        />
      )}

      {state.status === 'success' && state.data.length > 0 && (
        <FlatList
          data={state.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} onPress={openVideo} />}
          ListHeaderComponent={
            lastUpdatedAt ? (
              <ThemedText type="caption" color="textSecondary" style={styles.lastUpdated}>
                Updated {formatRelativeTime(lastUpdatedAt)}
              </ThemedText>
            ) : null
          }
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
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  lastUpdated: {
    marginBottom: Spacing.four,
  },
});
