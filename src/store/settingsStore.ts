import { create } from 'zustand';

import { getSetting, setSetting } from '@/services/database';
import type { AppSettings, MaxShortsPerSession, RefreshIntervalMinutes } from '@/types';

const SETTINGS_KEYS = {
  hideShorts: 'hideShorts',
  refreshIntervalMinutes: 'refreshIntervalMinutes',
  maxShortsPerSession: 'maxShortsPerSession',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  hideShorts: true,
  refreshIntervalMinutes: 30,
  maxShortsPerSession: 'unlimited',
};

type SettingsStore = AppSettings & {
  hydrated: boolean;
  /** Loads persisted values from SQLite over the defaults. Call once at app start
   * (see src/app/_layout.tsx) — cheap, and every setter already persists on its own,
   * so this only matters for picking up what a previous app run saved. */
  hydrate: () => Promise<void>;
  setHideShorts: (hideShorts: boolean) => void;
  setRefreshInterval: (minutes: RefreshIntervalMinutes) => void;
  setMaxShortsPerSession: (limit: MaxShortsPerSession) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const [hideShorts, refreshIntervalMinutes, maxShortsPerSession] = await Promise.all([
      getSetting(SETTINGS_KEYS.hideShorts, DEFAULT_SETTINGS.hideShorts),
      getSetting(SETTINGS_KEYS.refreshIntervalMinutes, DEFAULT_SETTINGS.refreshIntervalMinutes),
      getSetting(SETTINGS_KEYS.maxShortsPerSession, DEFAULT_SETTINGS.maxShortsPerSession),
    ]);
    set({ hideShorts, refreshIntervalMinutes, maxShortsPerSession, hydrated: true });
  },

  setHideShorts: (hideShorts) => {
    set({ hideShorts });
    void setSetting(SETTINGS_KEYS.hideShorts, hideShorts);
  },

  setRefreshInterval: (refreshIntervalMinutes) => {
    set({ refreshIntervalMinutes });
    void setSetting(SETTINGS_KEYS.refreshIntervalMinutes, refreshIntervalMinutes);
  },

  setMaxShortsPerSession: (maxShortsPerSession) => {
    set({ maxShortsPerSession });
    void setSetting(SETTINGS_KEYS.maxShortsPerSession, maxShortsPerSession);
  },
}));
