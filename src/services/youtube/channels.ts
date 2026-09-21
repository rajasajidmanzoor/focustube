import { YOUTUBE_CACHE_TTL_MS, YOUTUBE_CHANNEL_PARTS } from '@/constants';
import type { YouTubeChannelListItem, YouTubeChannelListResponse } from '@/types';
import { parseChannelInput } from '@/utils';

import { getCached, setCached } from './cache';
import { chunkArray, pickThumbnailUrl, youtubeGet, YouTubeApiError } from './youtubeApi';

export type ResolvedChannel = {
  id: string;
  title: string;
  handle: string | null;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
};

function mapChannelItem(item: YouTubeChannelListItem): ResolvedChannel | null {
  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!item.snippet || !uploadsPlaylistId) return null;

  return {
    id: item.id,
    title: item.snippet.title,
    handle: item.snippet.customUrl ?? null,
    thumbnailUrl: pickThumbnailUrl(item.snippet.thumbnails),
    uploadsPlaylistId,
  };
}

/** Resolves a pasted channel URL, @handle, legacy username, or raw channel ID to
 * canonical channel metadata. Uses channels.list only (1 quota unit) — never
 * search.list — so resolution stays cheap and deterministic. */
export async function resolveChannel(input: string): Promise<ResolvedChannel> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new YouTubeApiError('http', 'Enter a channel URL, @handle, or channel ID.');
  }

  const parsed = parseChannelInput(trimmed);
  const cacheKey = `channel:${parsed.type}:${parsed.value}`;
  const cached = getCached<ResolvedChannel>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string> = { part: YOUTUBE_CHANNEL_PARTS };
  if (parsed.type === 'id') params.id = parsed.value;
  else if (parsed.type === 'handle') params.forHandle = parsed.value;
  else params.forUsername = parsed.value;

  const response = await youtubeGet<YouTubeChannelListResponse>('/channels', params);
  const resolved = response.items?.[0] ? mapChannelItem(response.items[0]) : null;

  if (!resolved) {
    throw new YouTubeApiError(
      'not_found',
      `Couldn't find a YouTube channel for "${input}". Try pasting the channel's full URL or @handle instead.`,
    );
  }

  setCached(cacheKey, resolved, YOUTUBE_CACHE_TTL_MS);
  return resolved;
}

/** Looks up (or re-confirms) a channel's uploads playlist ID from its channel ID. */
export async function getChannelUploadsPlaylist(channelId: string): Promise<string> {
  const cacheKey = `uploadsPlaylist:${channelId}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const response = await youtubeGet<YouTubeChannelListResponse>('/channels', {
    part: 'contentDetails',
    id: channelId,
  });

  const uploadsPlaylistId = response.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YouTubeApiError('not_found', 'This channel could not be found. It may have been deleted.');
  }

  setCached(cacheKey, uploadsPlaylistId, YOUTUBE_CACHE_TTL_MS);
  return uploadsPlaylistId;
}

/** Batched title/thumbnail lookup for a set of channel IDs — channels.list accepts up
 * to 50 comma-separated IDs per call for a flat 1 quota unit, so this stays cheap
 * regardless of whitelist size. Used to refresh channel avatars/titles without an
 * extra call per channel. */
export async function getChannelsMetaById(
  channelIds: string[],
): Promise<Map<string, { title: string; handle: string | null; thumbnailUrl: string }>> {
  const result = new Map<string, { title: string; handle: string | null; thumbnailUrl: string }>();
  if (channelIds.length === 0) return result;

  for (const batch of chunkArray(channelIds, 50)) {
    const response = await youtubeGet<YouTubeChannelListResponse>('/channels', {
      part: YOUTUBE_CHANNEL_PARTS,
      id: batch.join(','),
    });

    for (const item of response.items ?? []) {
      const mapped = mapChannelItem(item);
      if (mapped) {
        result.set(item.id, { title: mapped.title, handle: mapped.handle, thumbnailUrl: mapped.thumbnailUrl });
      }
    }
  }

  return result;
}
