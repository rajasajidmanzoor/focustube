import type { Video } from '@/types';

import { useMockVideoFeed } from './useMockVideoFeed';

function isLongForm(video: Video): boolean {
  return !video.isShort;
}

export function useHomeFeed() {
  return useMockVideoFeed(isLongForm);
}
