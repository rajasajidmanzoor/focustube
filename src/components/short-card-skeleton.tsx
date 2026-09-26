import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { Colors, Spacing } from '@/theme';

type Props = { height: number };

/** Full-bleed placeholder matching ShortCard's footprint while the first Short's
 * thumbnail loads. */
export function ShortCardSkeleton({ height }: Props) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.content}>
        <Skeleton width={32} height={32} radius={16} />
        <View style={styles.textColumn}>
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="35%" style={styles.gapTop} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'flex-end',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.two,
  },
  gapTop: {
    marginTop: 2,
  },
});
