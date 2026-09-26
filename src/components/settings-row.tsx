import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/theme';

type Props = {
  label: string;
  description?: string;
  control: ReactNode;
  last?: boolean;
};

/** A native-Android-style settings row: full-width, screen-background, minimum
 * 56dp-tall touch target, hairline divider between rows (not after the last one in
 * a section). */
export function SettingsRow({ label, description, control, last = false }: Props) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.textColumn}>
        <ThemedText>{label}</ThemedText>
        {description && (
          <ThemedText type="caption" color="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        )}
      </View>
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  description: {
    marginTop: 1,
  },
});
