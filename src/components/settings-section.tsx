import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/theme';

type Props = { title: string; children: ReactNode };

/** Flat, native-Android-style grouped section — a label followed by full-width rows
 * on the screen's own background, not a floating card. Matches the platform's own
 * Settings app rather than an iOS-style boxed group. */
export function SettingsSection({ title, children }: Props) {
  return (
    <View style={styles.section}>
      <ThemedText type="captionBold" color="accent" style={styles.title}>
        {title.toUpperCase()}
      </ThemedText>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.five,
  },
  title: {
    marginBottom: Spacing.one,
    marginLeft: Spacing.four,
    letterSpacing: 0.6,
  },
});
