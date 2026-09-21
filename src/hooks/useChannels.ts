import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { toFriendlyChannelError, useChannelsStore, type ResolvedChannel } from '@/store';

export type { ResolvedChannel };

/** Thin wrapper around channelsStore for screens — see store/channelsStore.ts for the
 * actual resolve/save/sync workflow. */
export function useChannels() {
  const state = useChannelsStore((store) => store.state);
  const load = useChannelsStore((store) => store.load);
  const previewChannel = useChannelsStore((store) => store.previewChannel);
  const confirmChannel = useChannelsStore((store) => store.confirmChannel);
  const removeChannel = useChannelsStore((store) => store.removeChannel);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { state, previewChannel, confirmChannel, removeChannel, refetch };
}

export { toFriendlyChannelError };
