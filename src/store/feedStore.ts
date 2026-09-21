import { create } from 'zustand';

import { listCachedFeed, listChannels } from '@/services/database';
import { YouTubeApiError } from '@/services/youtube';
import type { AsyncState, Channel, Video } from '@/types';

import { useSettingsStore } from './settingsStore';
import { syncChannel } from './sync';

function isStale(channel: Channel, refreshIntervalMinutes: number): boolean {
  if (!channel.lastSyncedAt) return true;
  const ageMs = Date.now() - new Date(channel.lastSyncedAt).getTime();
  return ageMs >= refreshIntervalMinutes * 60 * 1000;
}

function friendlySyncError(error: unknown): string {
  if (error instanceof YouTubeApiError) {
    if (error.kind === 'quota') return 'YouTube is temporarily unavailable. Pull to refresh again later.';
    if (error.kind === 'network') return "Couldn't reach YouTube. Check your connection and try again.";
    if (error.kind === 'config') return 'FocusTube is not fully set up yet.';
  }
  return 'Could not refresh your feed.';
}

type FeedStoreState = {
  /** Every cached video (long-form AND Shorts) across active channels, newest first.
   * Home and Shorts both read this one store and filter client-side by `isShort` —
   * see hooks/useHomeFeed.ts and hooks/useShortsFeed.ts — so switching tabs never
   * triggers a second, redundant sync of the same channels. */
  state: AsyncState<Video[]>;
  /** True while a background or pull-to-refresh sync is in flight — distinct from
   * `state.status === 'loading'`, which only covers the very first cache read. */
  isSyncing: boolean;
  hasChannels: boolean;
};

type FeedStoreActions = {
  /** Loads cached content and kicks off a non-blocking background refresh of
   * whichever channels are stale. Safe to call on every Home/Shorts focus (not just
   * mount) — e.g. after adding a channel on the Channels tab and switching back —
   * since it never resets `state` to 'loading' once there's already data, so it
   * never flashes a spinner over content that's already on screen. */
  init: () => Promise<void>;
  /** `force: true` (pull-to-refresh) syncs every channel regardless of staleness.
   * `force: false` only syncs channels past the settings refresh interval — this is
   * what keeps FocusTube from making unnecessary API requests. */
  refresh: (force: boolean) => Promise<void>;
};

async function readCache(): Promise<{ videos: Video[]; channels: Channel[] }> {
  const [channels, videos] = await Promise.all([listChannels(), listCachedFeed('all')]);
  return { videos, channels };
}

export const useFeedStore = create<FeedStoreState & FeedStoreActions>((set, get) => ({
  state: { status: 'loading' },
  isSyncing: false,
  hasChannels: false,

  init: async () => {
    try {
      const { videos, channels } = await readCache();
      set({ state: { status: 'success', data: videos }, hasChannels: channels.length > 0 });
    } catch {
      // Keep whatever's already on screen rather than clobbering good cached data
      // with an error just because a routine focus-revalidation's read failed.
      set((store) =>
        store.state.status === 'success' ? store : { state: { status: 'error', message: 'Could not load your feed.' } },
      );
      return;
    }

    void get().refresh(false);
  },

  refresh: async (force: boolean) => {
    // Home and Shorts can both call init() around the same time; this guard stops a
    // second concurrent sync of the same channels rather than doubling API calls.
    if (get().isSyncing) return;

    let channels: Channel[];
    try {
      channels = await listChannels();
    } catch {
      return;
    }

    if (channels.length === 0) {
      set({ state: { status: 'success', data: [] }, hasChannels: false });
      return;
    }

    const { refreshIntervalMinutes } = useSettingsStore.getState();
    const targets = force ? channels : channels.filter((channel) => isStale(channel, refreshIntervalMinutes));

    // Nothing due for a re-sync — avoid unnecessary API requests entirely.
    if (targets.length === 0) return;

    set({ isSyncing: true });
    const results = await Promise.allSettled(targets.map((channel) => syncChannel(channel.id)));
    const allFailed = results.length > 0 && results.every((result) => result.status === 'rejected');

    try {
      const videos = await listCachedFeed('all');

      if (videos.length === 0 && allFailed) {
        const firstFailure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
        set({
          state: { status: 'error', message: friendlySyncError(firstFailure?.reason) },
          isSyncing: false,
          hasChannels: true,
        });
        return;
      }

      set({ state: { status: 'success', data: videos }, isSyncing: false, hasChannels: true });
    } catch {
      set({ isSyncing: false });
    }
  },
}));
