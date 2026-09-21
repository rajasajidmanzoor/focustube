export type RefreshIntervalMinutes = 15 | 30 | 60;

export type MaxShortsPerSession = 'unlimited' | 5 | 10 | 20 | 50 | 100;

export type AppSettings = {
  /** Default true — Shorts are hidden (tab + feed) out of the box; the user opts in. */
  hideShorts: boolean;
  refreshIntervalMinutes: RefreshIntervalMinutes;
  maxShortsPerSession: MaxShortsPerSession;
};
