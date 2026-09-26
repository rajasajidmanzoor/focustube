import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { Colors, Radii, Spacing } from '@/theme';

/** Mirrors ChannelListItem's layout so the loading → loaded transition doesn't jump. */
export function ChannelListItemSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} radius={24} />
      <View style={styles.textColumn}>
        <Skeleton height={17} width="70%" />
        <Skeleton height={12} width="45%" style={styles.gapTop} />
      </View>
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
    gap: Spacing.two,
  },
  gapTop: {
    marginTop: 2,
  },
});
