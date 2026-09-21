import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useFeedStore } from '@/store';
import type { AsyncState, Video } from '@/types';

function isLongForm(video: Video): boolean {
  return !video.isShort;
}

/** Thin wrapper around the shared feedStore for the Home screen — filters to
 * long-form videos. See store/feedStore.ts for the cached-first, staleness-aware
 * sync pipeline (shared with Shorts, so switching tabs doesn't re-sync). */
export function useHomeFeed() {
  const rawState = useFeedStore((store) => store.state);
  const hasChannels = useFeedStore((store) => store.hasChannels);
  const isSyncing = useFeedStore((store) => store.isSyncing);
  const lastUpdatedAt = useFeedStore((store) => store.lastUpdatedAt);
  const init = useFeedStore((store) => store.init);
  const refreshAction = useFeedStore((store) => store.refresh);

  const [refreshing, setRefreshing] = useState(false);

  // Re-validates every time Home gains focus (not just on mount) — e.g. returning
  // here after adding a channel on the Channels tab. init() never flashes a loading
  // spinner over content that's already showing (see feedStore.ts).
  useFocusEffect(
    useCallback(() => {
      void init();
    }, [init]),
  );

  const state = useMemo<AsyncState<Video[]>>(() => {
    if (rawState.status !== 'success') return rawState;
    return { status: 'success', data: rawState.data.filter(isLongForm) };
  }, [rawState]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAction(true);
    setRefreshing(false);
  }, [refreshAction]);

  const refetch = useCallback(() => {
    void init();
  }, [init]);

  return { state, refreshing, refetch, refresh, hasChannels, isSyncing, lastUpdatedAt };
}
