import type { Video } from '@/types';

import { useMockVideoFeed } from './useMockVideoFeed';

function isShort(video: Video): boolean {
  return video.isShort;
}

export function useShortsFeed() {
  return useMockVideoFeed(isShort);
}
