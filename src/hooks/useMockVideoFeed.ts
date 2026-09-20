import { useCallback, useEffect, useState } from 'react';

import { mockVideos } from '@/services/youtube/mockData';
import type { AsyncState, Video } from '@/types';

const DELAY_MS = 500;

/** Shared plumbing for the mock Home/Shorts feeds — simulates network latency and
 * pull-to-refresh so the real loading/error/empty states are exercised today. */
export function useMockVideoFeed(filter: (video: Video) => boolean) {
  const [state, setState] = useState<AsyncState<Video[]>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  // Starts the timer only — does not set state synchronously, so it's safe to call
  // directly from the mount effect (react-hooks/set-state-in-effect).
  const fetchData = useCallback(() => {
    const timer = setTimeout(() => {
      const data = mockVideos
        .filter(filter)
        .slice()
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setState({ status: 'success', data });
      setRefreshing(false);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [filter]);

  useEffect(() => fetchData(), [fetchData]);

  const refetch = useCallback(() => {
    setState({ status: 'loading' });
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return { state, refreshing, refetch, refresh };
}
