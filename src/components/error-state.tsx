import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radii, Spacing } from '@/theme';

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <ThemedView style={styles.container}>
      <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText style={styles.buttonText}>Retry</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  centeredText: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.two,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontWeight: '600',
  },
});
