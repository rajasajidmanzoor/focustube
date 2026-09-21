import { useSettingsStore } from '@/store';

/** Thin wrapper around settingsStore, kept so screens read a plain `settings` object
 * instead of selecting each field individually. */
export function useSettings() {
  const shortsEnabled = useSettingsStore((store) => store.shortsEnabled);
  const refreshIntervalMinutes = useSettingsStore((store) => store.refreshIntervalMinutes);
  const setShortsEnabled = useSettingsStore((store) => store.setShortsEnabled);
  const setRefreshInterval = useSettingsStore((store) => store.setRefreshInterval);

  return { settings: { shortsEnabled, refreshIntervalMinutes }, setShortsEnabled, setRefreshInterval };
}
