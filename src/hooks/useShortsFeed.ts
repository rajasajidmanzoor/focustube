import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useFeedStore } from '@/store';
import type { AsyncState, Video } from '@/types';

/** Thin wrapper around the shared feedStore for the Shorts screen — filters to
 * `isShort` videos only. Reads the same store/sync pipeline as Home (see
 * useHomeFeed.ts), so opening both tabs never sync the same channels twice. */
export function useShortsFeed() {
  const rawState = useFeedStore((store) => store.state);
  const hasChannels = useFeedStore((store) => store.hasChannels);
  const isSyncing = useFeedStore((store) => store.isSyncing);
  const init = useFeedStore((store) => store.init);
  const refreshAction = useFeedStore((store) => store.refresh);

  const [refreshing, setRefreshing] = useState(false);

  // Re-validates every time Shorts gains focus (not just on mount) — see
  // useHomeFeed.ts for why.
  useFocusEffect(
    useCallback(() => {
      void init();
    }, [init]),
  );

  const state = useMemo<AsyncState<Video[]>>(() => {
    if (rawState.status !== 'success') return rawState;
    return { status: 'success', data: rawState.data.filter((video) => video.isShort) };
  }, [rawState]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAction(true);
    setRefreshing(false);
  }, [refreshAction]);

  const refetch = useCallback(() => {
    void init();
  }, [init]);

  return { state, refreshing, refetch, refresh, hasChannels, isSyncing };
}
