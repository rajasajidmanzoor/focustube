import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { Radii, Spacing } from '@/theme';

/** Mirrors VideoCard's layout so the loading → loaded transition doesn't jump. */
export function VideoCardSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton radius={Radii.medium} style={styles.thumbnail} />
      <View style={styles.meta}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={styles.textColumn}>
          <Skeleton height={16} width="90%" />
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" style={styles.metaLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.five,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.two,
  },
  metaLine: {
    marginTop: 2,
  },
});
