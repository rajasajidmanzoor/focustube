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
      <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable onPress={onRetry} style={styles.button}>
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
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  centeredText: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.three,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buttonText: {
    fontWeight: '600',
  },
});
