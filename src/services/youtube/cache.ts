// Session-only in-memory cache for channel/video lookups — avoids redundant API calls
// (and quota burn) for the same channel within a short window, e.g. re-adding a
// channel you just resolved, or a rapid pull-to-refresh. Cleared on app restart.
// Durable, cross-restart caching of video metadata lives in SQLite
// (services/database), not here.

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearYouTubeApiCache(): void {
  store.clear();
}
