import { PLAYLIST_ITEMS_PAGE_SIZE, YOUTUBE_PLAYLIST_ITEM_PARTS } from '@/constants';
import type { YouTubePlaylistItemListResponse } from '@/types';

import { youtubeGet } from './youtubeApi';

export type PlaylistVideoRef = {
  videoId: string;
  publishedAt: string;
};

/** Lists up to `maxResults` video refs from a playlist (newest first, as returned by
 * the API), following `nextPageToken` as needed. Stops as soon as `maxResults` is
 * reached so a channel with thousands of uploads never pulls more than requested. */
export async function getPlaylistVideoRefs(playlistId: string, maxResults: number): Promise<PlaylistVideoRef[]> {
  const refs: PlaylistVideoRef[] = [];
  let pageToken: string | undefined;

  while (refs.length < maxResults) {
    const pageSize = Math.min(PLAYLIST_ITEMS_PAGE_SIZE, maxResults - refs.length, 50);

    const params: Record<string, string> = {
      part: YOUTUBE_PLAYLIST_ITEM_PARTS,
      playlistId,
      maxResults: String(pageSize),
    };
    if (pageToken) params.pageToken = pageToken;

    const response = await youtubeGet<YouTubePlaylistItemListResponse>('/playlistItems', params);
    const items = response.items ?? [];

    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      const publishedAt = item.snippet?.publishedAt;
      if (videoId && publishedAt) {
        refs.push({ videoId, publishedAt });
      }
      if (refs.length >= maxResults) break;
    }

    if (!response.nextPageToken || items.length === 0) break;
    pageToken = response.nextPageToken;
  }

  return refs;
}
