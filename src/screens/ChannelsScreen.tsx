import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { AddChannelModal } from '@/components/add-channel-modal';
import { AppHeader } from '@/components/app-header';
import { ChannelListItem } from '@/components/channel-list-item';
import { ChannelListItemSkeleton } from '@/components/channel-list-item-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { IconButton } from '@/components/icon-button';
import { ThemedView } from '@/components/themed-view';
import { useChannels } from '@/hooks';
import { Spacing } from '@/theme';
import type { Channel } from '@/types';

const SKELETON_ROWS = [0, 1, 2, 3];

export function ChannelsScreen() {
  const { state, previewChannel, confirmChannel, removeChannel, refetch } = useChannels();
  const [modalVisible, setModalVisible] = useState(false);

  const handleRemove = (channel: Channel) => {
    Alert.alert('Remove channel?', `${channel.title} will be removed from your whitelist.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeChannel(channel.id) },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader
        title="Channels"
        right={<IconButton name="add" accessibilityLabel="Add channel" onPress={() => setModalVisible(true)} />}
      />

      {state.status === 'loading' && (
        <View style={styles.list}>
          {SKELETON_ROWS.map((key) => (
            <ChannelListItemSkeleton key={key} />
          ))}
        </View>
      )}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={refetch} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyState
          icon="people-outline"
          title="No channels yet"
          description="Add a YouTube channel to start building your whitelist."
          actionLabel="Add a channel"
          onAction={() => setModalVisible(true)}
        />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <FlatList
          data={state.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChannelListItem channel={item} onRemove={handleRemove} />}
          contentContainerStyle={styles.list}
        />
      )}

      <AddChannelModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        previewChannel={previewChannel}
        confirmChannel={confirmChannel}
      />
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
