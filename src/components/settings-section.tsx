import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';

type Props = { title: string; children: ReactNode };

export function SettingsSection({ title, children }: Props) {
  return (
    <View style={styles.section}>
      <ThemedText type="caption" color="textSecondary" style={styles.title}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
    marginLeft: Spacing.two,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.medium,
    overflow: 'hidden',
  },
});
