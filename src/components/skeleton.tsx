import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type DimensionValue } from 'react-native';

import { Colors, Radii } from '@/theme';

type Props = {
  width?: DimensionValue;
  /** Omit when `style` provides sizing itself (e.g. `aspectRatio`) — an explicit
   * height here always wins over aspectRatio in Yoga, so don't pass both. */
  height?: number;
  radius?: number;
  style?: object;
};

/** A single pulsing placeholder shape. Deliberately a slow, subtle opacity pulse
 * (not a moving shimmer sweep) — enough to read as "loading" without being one of
 * the flashy animations the design direction asks to avoid. */
export function Skeleton({ width = '100%', height, radius = Radii.small, style }: Props) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width, borderRadius: radius, opacity }, height != null && { height }, style]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceElevated,
  },
});
