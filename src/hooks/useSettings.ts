import { useSettingsStore } from '@/store';

/** Thin wrapper around settingsStore, kept so screens read a plain `settings` object
 * instead of selecting each field individually. */
export function useSettings() {
  const hideShorts = useSettingsStore((store) => store.hideShorts);
  const refreshIntervalMinutes = useSettingsStore((store) => store.refreshIntervalMinutes);
  const maxShortsPerSession = useSettingsStore((store) => store.maxShortsPerSession);
  const setHideShorts = useSettingsStore((store) => store.setHideShorts);
  const setRefreshInterval = useSettingsStore((store) => store.setRefreshInterval);
  const setMaxShortsPerSession = useSettingsStore((store) => store.setMaxShortsPerSession);

  return {
    settings: { hideShorts, refreshIntervalMinutes, maxShortsPerSession },
    setHideShorts,
    setRefreshInterval,
    setMaxShortsPerSession,
  };
}
