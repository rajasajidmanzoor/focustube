import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';
import { formatDuration } from '@/utils';

type Props = { seconds: number };

export function DurationBadge({ seconds }: Props) {
  return (
    <ThemedText type="captionBold" style={styles.badge}>
      {formatDuration(seconds)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: Spacing.one,
    bottom: Spacing.one,
    backgroundColor: Colors.overlay,
    color: Colors.text,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Radii.small,
    overflow: 'hidden',
  },
});
