import { useCallback, useEffect, useState } from 'react';

import { mockChannels } from '@/services/youtube/mockData';
import type { AsyncState, Channel } from '@/types';

const DELAY_MS = 400;

/** Mock whitelist CRUD — local component state only, no persistence yet (TODO.md
 * Phase 2/3 will move this to expo-sqlite + zustand). */
export function useChannels() {
  const [state, setState] = useState<AsyncState<Channel[]>>({ status: 'loading' });

  // Starts the timer only — does not set state synchronously, so it's safe to call
  // directly from the mount effect (react-hooks/set-state-in-effect).
  const fetchChannels = useCallback(() => {
    const timer = setTimeout(() => {
      setState({ status: 'success', data: mockChannels.slice() });
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => fetchChannels(), [fetchChannels]);

  const refetch = useCallback(() => {
    setState({ status: 'loading' });
    fetchChannels();
  }, [fetchChannels]);

  const addChannel = useCallback((name: string) => {
    setState((prev) => {
      if (prev.status !== 'success') return prev;
      const newChannel: Channel = {
        id: `mock-${Date.now()}`,
        title: name,
        thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`,
        addedAt: new Date().toISOString(),
      };
      return { status: 'success', data: [newChannel, ...prev.data] };
    });
  }, []);

  const removeChannel = useCallback((id: string) => {
    setState((prev) => {
      if (prev.status !== 'success') return prev;
      return { status: 'success', data: prev.data.filter((channel) => channel.id !== id) };
    });
  }, []);

  return { state, addChannel, removeChannel, refetch };
}
