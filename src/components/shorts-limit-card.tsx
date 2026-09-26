import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';

type Props = {
  height: number;
  onBackToVideos: () => void;
  onContinueAnyway: () => void;
};

/** Shown in place of the next Short once "Maximum Shorts per session" is reached —
 * a full-height card matching ShortCard's sizing so it slots naturally into the same
 * paginated feed instead of interrupting the swipe gesture. */
export function ShortsLimitCard({ height, onBackToVideos, onContinueAnyway }: Props) {
  return (
    <View style={[styles.container, { height }]}>
      <ThemedText type="subtitle" style={styles.message}>
        You&apos;ve reached your Shorts limit.
      </ThemedText>
      <View style={styles.actions}>
        <Pressable
          onPress={onBackToVideos}
          accessibilityRole="button"
          accessibilityLabel="Back to Videos"
          style={styles.primaryButton}>
          <ThemedText style={styles.primaryButtonText}>Back to Videos</ThemedText>
        </Pressable>
        <Pressable
          onPress={onContinueAnyway}
          accessibilityRole="button"
          accessibilityLabel="Continue Anyway"
          style={styles.secondaryButton}>
          <ThemedText color="textSecondary">Continue Anyway</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: Radii.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
});
