import { create } from 'zustand';

import { getSetting, setSetting } from '@/services/database';
import * as db from '@/services/database';
import { resolveChannel, YouTubeApiError, type ResolvedChannel } from '@/services/youtube';
import type { AsyncState, Channel } from '@/types';

import { syncChannel } from './sync';

export type { ResolvedChannel };

const HAS_SEEDED_DEFAULT_CHANNELS_KEY = 'hasSeededDefaultChannels';
// FocusTube ships with these two channels pre-approved so a fresh install isn't a
// totally empty feed — same as any channel the user adds themselves: fully visible
// in Channels, removable at any time, and never re-added once removed (the seed only
// ever runs once, guarded by HAS_SEEDED_DEFAULT_CHANNELS_KEY below).
const DEFAULT_CHANNEL_HANDLES = ['@GoogleDevelopers', '@rsajidmanzoor'];

/** Adds FocusTube's pre-approved starter channels, but only the very first time the
 * app ever runs — call once at startup (see src/app/_layout.tsx). Safe to call again
 * later (e.g. a second install on the same cached settings db): it's a no-op once the
 * flag is set, so a channel the user deliberately removed never comes back. */
export async function seedDefaultChannelsIfNeeded(): Promise<void> {
  const alreadySeeded = await getSetting(HAS_SEEDED_DEFAULT_CHANNELS_KEY, false);
  if (alreadySeeded) return;

  for (const handle of DEFAULT_CHANNEL_HANDLES) {
    try {
      const resolved = await resolveChannel(handle);
      if (await db.isChannelAdded(resolved.id)) continue;

      const saved = await db.addChannel(resolved);
      await syncChannel(saved.id);
    } catch {
      // A starter channel failing to resolve/sync (no network on first launch, the
      // handle changed, etc.) shouldn't block the app or the other starter channel —
      // the user can always add channels manually regardless.
    }
  }

  await setSetting(HAS_SEEDED_DEFAULT_CHANNELS_KEY, true);
}

class DuplicateChannelError extends Error {
  constructor() {
    super('DUPLICATE_CHANNEL');
    this.name = 'DuplicateChannelError';
  }
}

/** Turns any thrown error from the add-channel workflow into a short, friendly
 * message safe to show directly in the UI — never a status code or quota reason
 * string. */
export function toFriendlyChannelError(error: unknown): string {
  if (error instanceof DuplicateChannelError) {
    return 'This channel is already in your list.';
  }
  if (error instanceof YouTubeApiError) {
    if (error.kind === 'quota') return 'YouTube is temporarily unavailable. Please try again later.';
    if (error.kind === 'not_found') return error.message; // always our own text — see youtubeApi.ts
    if (error.kind === 'config') return 'FocusTube is not fully set up yet. Please try again later.';
    if (error.kind === 'network') return "Couldn't reach YouTube. Check your connection and try again.";
    return "Couldn't resolve that channel. Please try again.";
  }
  return 'Something went wrong. Please try again.';
}

type ChannelsStoreState = {
  state: AsyncState<Channel[]>;
};

type ChannelsStoreActions = {
  load: () => Promise<void>;
  /** Resolves user input against the YouTube API and checks for duplicates, without
   * saving anything — used to render the confirmation preview. */
  previewChannel: (input: string) => Promise<ResolvedChannel>;
  /** Saves a previously-previewed channel, then triggers its initial sync. */
  confirmChannel: (preview: ResolvedChannel) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
};

export const useChannelsStore = create<ChannelsStoreState & ChannelsStoreActions>((set, get) => ({
  state: { status: 'loading' },

  // Never resets `state` to 'loading' once there's already data, so it's safe to call
  // on every screen focus (not just mount) without flashing a spinner over content
  // that's already showing — see feedStore.ts's init() for the same pattern.
  load: async () => {
    try {
      const channels = await db.listChannels();
      set({ state: { status: 'success', data: channels } });
    } catch {
      set((store) =>
        store.state.status === 'success' ? store : { state: { status: 'error', message: 'Could not load your channels.' } },
      );
    }
  },

  previewChannel: async (input: string) => {
    const resolved = await resolveChannel(input);

    const current = get().state;
    const alreadyAdded = current.status === 'success' && current.data.some((channel) => channel.id === resolved.id);
    if (alreadyAdded) {
      throw new DuplicateChannelError();
    }

    return resolved;
  },

  confirmChannel: async (preview: ResolvedChannel) => {
    const saved = await db.addChannel(preview);

    // Show the new channel immediately; initial sync fills in its videos in the
    // background without blocking "return to Channels screen".
    set((store) => ({
      state: store.state.status === 'success' ? { status: 'success', data: [saved, ...store.state.data] } : store.state,
    }));

    try {
      await syncChannel(saved.id);
      const synced = await db.getChannelById(saved.id);
      if (synced) {
        set((store) => ({
          state:
            store.state.status === 'success'
              ? { status: 'success', data: store.state.data.map((channel) => (channel.id === synced.id ? synced : channel)) }
              : store.state,
        }));
      }
    } catch {
      // Initial sync failing shouldn't block adding the channel — the channel is
      // already saved and visible, and the Home feed's own refresh will retry it.
    }
  },

  removeChannel: async (id: string) => {
    const previous = get().state;
    if (previous.status === 'success') {
      set({ state: { status: 'success', data: previous.data.filter((channel) => channel.id !== id) } });
    }
    try {
      await db.removeChannel(id);
    } catch {
      set({ state: previous });
    }
  },
}));
