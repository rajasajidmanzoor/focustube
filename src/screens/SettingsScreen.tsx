import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { SettingsRow } from '@/components/settings-row';
import { SettingsSection } from '@/components/settings-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/hooks';
import { Colors, Radii, Spacing } from '@/theme';
import type { RefreshIntervalMinutes } from '@/types';

const REFRESH_OPTIONS: RefreshIntervalMinutes[] = [15, 30, 60];

function confirmClear(title: string, message: string, confirmedMessage: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', confirmedMessage) },
  ]);
}

export function SettingsScreen() {
  const { settings, setShortsEnabled, setRefreshInterval } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Playback">
          <SettingsRow
            label="Shorts"
            description="Show the Shorts tab and include short-form videos."
            last
            control={
              <Switch
                value={settings.shortsEnabled}
                onValueChange={setShortsEnabled}
                trackColor={{ false: Colors.selected, true: Colors.accent }}
                thumbColor={Colors.text}
              />
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
            label="Clear cache"
            description="Remove locally cached video metadata."
            control={
              <Pressable
                onPress={() => confirmClear('Clear cache?', 'This removes locally cached video metadata.', 'Cache cleared.')}
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
                  confirmClear('Clear watch history?', 'This removes all recorded watch history.', 'Watch history cleared.')
                }
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
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceElevated,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
  },
  destructiveButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
