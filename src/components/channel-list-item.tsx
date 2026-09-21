import { StyleSheet, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/theme';
import type { Channel } from '@/types';
import { formatRelativeTime } from '@/utils';

type Props = {
  channel: Channel;
  onRemove: (channel: Channel) => void;
};

export function ChannelListItem({ channel, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <ChannelAvatar uri={channel.thumbnailUrl} size={44} />
      <View style={styles.textColumn}>
        <ThemedText numberOfLines={1}>{channel.title}</ThemedText>
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
          {channel.lastSyncedAt ? `Synced ${formatRelativeTime(channel.lastSyncedAt)}` : 'Not synced yet'}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  textColumn: {
    flex: 1,
    gap: 2,
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
