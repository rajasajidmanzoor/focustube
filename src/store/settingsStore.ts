import { create } from 'zustand';

import type { AppSettings, RefreshIntervalMinutes } from '@/types';

type SettingsStore = AppSettings & {
  setShortsEnabled: (enabled: boolean) => void;
  setRefreshInterval: (minutes: RefreshIntervalMinutes) => void;
};

// Local-only for now (TODO.md Phase 2/3 will persist this via settingsRepository).
// feedStore reads refreshIntervalMinutes directly from this store to decide which
// channels are stale enough to re-sync.
export const useSettingsStore = create<SettingsStore>((set) => ({
  shortsEnabled: true,
  refreshIntervalMinutes: 30,
  setShortsEnabled: (shortsEnabled) => set({ shortsEnabled }),
  setRefreshInterval: (refreshIntervalMinutes) => set({ refreshIntervalMinutes }),
}));
