import { StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';
import type { Channel } from '@/types';
import { formatRelativeTime } from '@/utils';

type Props = {
  channel: Channel;
  onRemove: (channel: Channel) => void;
};

export function ChannelListItem({ channel, onRemove }: Props) {
  const syncedLabel = channel.lastSyncedAt ? `Synced ${formatRelativeTime(channel.lastSyncedAt)}` : 'Not synced yet';

  return (
    <View style={styles.card}>
      <ChannelAvatar uri={channel.thumbnailUrl} size={48} />
      <View style={styles.textColumn}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {channel.title}
        </ThemedText>
        <View style={styles.metaRow}>
          {channel.handle && (
            <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
              {channel.handle}
            </ThemedText>
          )}
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <ThemedText type="caption" color="textSecondary">
              Active
            </ThemedText>
          </View>
        </View>
        <ThemedText type="caption" color="textSecondary">
          {syncedLabel}
        </ThemedText>
      </View>
      <IconButton
        name="trash-outline"
        color={Colors.error}
        accessibilityLabel={`Remove ${channel.title}`}
        onPress={() => onRemove(channel)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: Radii.large,
    backgroundColor: Colors.surface,
  },
  textColumn: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
});
