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

export function SettingsRow({ label, description, control, last = false }: Props) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.textColumn}>
        <ThemedText>{label}</ThemedText>
        {description && (
          <ThemedText type="caption" color="textSecondary">
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
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
});
