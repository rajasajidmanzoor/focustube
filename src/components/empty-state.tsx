import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radii, Spacing } from '@/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <ThemedView style={styles.container}>
      <Ionicons name={icon} size={40} color={Colors.textSecondary} />
      <ThemedText type="subtitle" style={styles.centeredText}>
        {title}
      </ThemedText>
      <ThemedText color="textSecondary" style={styles.centeredText}>
        {description}
      </ThemedText>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.button}>
          <ThemedText style={styles.buttonText}>{actionLabel}</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  centeredText: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.three,
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buttonText: {
    fontWeight: '600',
  },
});
