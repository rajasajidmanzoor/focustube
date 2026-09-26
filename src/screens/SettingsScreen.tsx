import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { SettingsRow } from '@/components/settings-row';
import { SettingsSection } from '@/components/settings-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/hooks';
import { clearAllCachedVideos, clearWatchHistory } from '@/services/database';
import { clearYouTubeApiCache } from '@/services/youtube';
import { Colors, Radii, Spacing } from '@/theme';
import type { MaxShortsPerSession, RefreshIntervalMinutes } from '@/types';

const REFRESH_OPTIONS: RefreshIntervalMinutes[] = [15, 30, 60];
const MAX_SHORTS_OPTIONS: MaxShortsPerSession[] = ['unlimited', 5, 10, 20, 50, 100];

function maxShortsLabel(value: MaxShortsPerSession): string {
  return value === 'unlimited' ? 'Unlimited' : String(value);
}

function confirmClear(title: string, message: string, onConfirm: () => void | Promise<void>, confirmedMessage: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Clear',
      style: 'destructive',
      onPress: () => {
        void Promise.resolve(onConfirm()).then(() => Alert.alert('Done', confirmedMessage));
      },
    },
  ]);
}

export function SettingsScreen() {
  const { settings, setHideShorts, setRefreshInterval, setMaxShortsPerSession } = useSettings();

  const clearCachedVideos = async () => {
    await clearAllCachedVideos();
    clearYouTubeApiCache();
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Playback">
          <SettingsRow
            label="Hide Shorts"
            description="Hide the Shorts tab and short-form videos entirely."
            control={
              <Switch
                value={settings.hideShorts}
                onValueChange={setHideShorts}
                trackColor={{ false: Colors.selected, true: Colors.accent }}
                thumbColor={Colors.text}
              />
            }
          />
          <SettingsRow
            label="Maximum Shorts per session"
            description="Stop and ask before showing more Shorts in one sitting."
            last
            control={
              <View style={styles.chipWrap}>
                {MAX_SHORTS_OPTIONS.map((option) => {
                  const selected = settings.maxShortsPerSession === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setMaxShortsPerSession(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Maximum Shorts per session: ${maxShortsLabel(option)}`}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <ThemedText type="caption" color={selected ? 'text' : 'textSecondary'}>
                        {maxShortsLabel(option)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection title="Feed">
          <SettingsRow
            label="Refresh interval"
            description="How often the feed checks for new uploads."
            last
            control={
              <View style={styles.chipRow}>
                {REFRESH_OPTIONS.map((minutes) => {
                  const selected = settings.refreshIntervalMinutes === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      onPress={() => setRefreshInterval(minutes)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Refresh interval: ${minutes} minutes`}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <ThemedText type="caption" color={selected ? 'text' : 'textSecondary'}>
                        {minutes}m
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow
            label="Dark theme"
            description="FocusTube is dark-only in V1."
            last
            control={
              <Switch value disabled trackColor={{ false: Colors.selected, true: Colors.accent }} thumbColor={Colors.text} />
            }
          />
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsRow
            label="Clear cached videos"
            description="Removes cached video metadata only. Your approved channels, settings, and watch history are kept."
            control={
              <Pressable
                onPress={() =>
                  confirmClear(
                    'Clear cached videos?',
                    'Clear cached video metadata?',
                    clearCachedVideos,
                    'Cached video metadata cleared.',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Clear cached videos"
                style={styles.destructiveButton}>
                <ThemedText color="error">Clear</ThemedText>
              </Pressable>
            }
          />
          <SettingsRow
            label="Clear watch history"
            description="Remove all recorded watch history."
            last
            control={
              <Pressable
                onPress={() =>
                  confirmClear(
                    'Clear watch history?',
                    'This removes all recorded watch history.',
                    clearWatchHistory,
                    'Watch history cleared.',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Clear watch history"
                style={styles.destructiveButton}>
                <ThemedText color="error">Clear</ThemedText>
              </Pressable>
            }
          />
        </SettingsSection>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.six,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'flex-end',
    maxWidth: 200,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceElevated,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
  },
  destructiveButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
