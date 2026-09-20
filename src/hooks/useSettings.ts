import { useCallback, useState } from 'react';

import type { AppSettings, RefreshIntervalMinutes } from '@/types';

const defaultSettings: AppSettings = {
  shortsEnabled: true,
  refreshIntervalMinutes: 30,
};

/** Local-only settings state (TODO.md Phase 2/3 will persist these via expo-sqlite). */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const setShortsEnabled = useCallback((shortsEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, shortsEnabled }));
  }, []);

  const setRefreshInterval = useCallback((refreshIntervalMinutes: RefreshIntervalMinutes) => {
    setSettings((prev) => ({ ...prev, refreshIntervalMinutes }));
  }, []);

  return { settings, setShortsEnabled, setRefreshInterval };
}
