import { MAX_UPLOADS_PER_CHANNEL, YOUTUBE_BATCH_ID_LIMIT, YOUTUBE_VIDEO_PARTS } from '@/constants';
import type { Video, YouTubeVideoListItem, YouTubeVideoListResponse } from '@/types';
import { classifyShort, parseIso8601Duration } from '@/utils';

import { getChannelsMetaById, getChannelUploadsPlaylist } from './channels';
import { getPlaylistVideoRefs } from './playlists';
import { chunkArray, pickThumbnailUrl, youtubeGet } from './youtubeApi';

function normalizeVideo(item: YouTubeVideoListItem): Video | undefined {
  if (!item.snippet || !item.contentDetails?.duration) return undefined;

  const durationSeconds = parseIso8601Duration(item.contentDetails.duration);

  return {
    id: item.id,
    channelId: item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    // videos.list doesn't return the channel's avatar — callers that need it (e.g.
    // getApprovedChannelFeed) fill it in from a channels.list lookup instead of
    // paying for a per-video channel call here.
    channelThumbnailUrl: '',
    title: item.snippet.title,
    thumbnailUrl: pickThumbnailUrl(item.snippet.thumbnails),
    publishedAt: item.snippet.publishedAt,
    durationSeconds,
    isShort: classifyShort({ durationSeconds }),
  };
}

/** Batch-fetches full metadata for video IDs (videos.list caps at 50 ids/request),
 * preserving the caller's ordering. Malformed/incomplete items are dropped rather
 * than throwing, so one bad item doesn't fail an entire sync. */
export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
  if (videoIds.length === 0) return [];

  const byId = new Map<string, Video>();

  for (const batch of chunkArray(videoIds, YOUTUBE_BATCH_ID_LIMIT)) {
    const response = await youtubeGet<YouTubeVideoListResponse>('/videos', {
      part: YOUTUBE_VIDEO_PARTS,
      id: batch.join(','),
    });

    for (const item of response.items ?? []) {
      const video = normalizeVideo(item);
      if (video) byId.set(video.id, video);
    }
  }

  return videoIds.map((id) => byId.get(id)).filter((video): video is Video => Boolean(video));
}

/** Retrieves a single channel's recent uploads, fully normalized (playlistItems.list
 * for the video ID list, then one batched videos.list for metadata — never
 * search.list). `channelThumbnailUrl` is left blank; fill it in from the whitelist's
 * own Channel record (avoids an extra API call per channel). */
export async function getChannelVideos(
  channelId: string,
  maxResults: number = MAX_UPLOADS_PER_CHANNEL,
): Promise<Video[]> {
  const uploadsPlaylistId = await getChannelUploadsPlaylist(channelId);
  const refs = await getPlaylistVideoRefs(uploadsPlaylistId, maxResults);
  return getVideosByIds(refs.map((ref) => ref.videoId));
}

function dedupeById(videos: Video[]): Video[] {
  const seen = new Map<string, Video>();
  for (const video of videos) {
    if (!seen.has(video.id)) seen.set(video.id, video);
  }
  return Array.from(seen.values());
}

/** Fetches recent videos for every approved channel, merges, deduplicates, and sorts
 * newest first — a direct, SQLite-independent view of "what the API has right now"
 * for the given whitelist. (The app's actual Home/Shorts feeds are served from
 * SQLite via services/database + store/, which this function's caller keeps in sync;
 * this is the piece that talks to YouTube.) */
export async function getApprovedChannelFeed(
  channelIds: string[],
  maxResultsPerChannel: number = MAX_UPLOADS_PER_CHANNEL,
): Promise<Video[]> {
  if (channelIds.length === 0) return [];

  const [channelMetaById, videosByChannel] = await Promise.all([
    getChannelsMetaById(channelIds),
    Promise.all(channelIds.map((id) => getChannelVideos(id, maxResultsPerChannel))),
  ]);

  const merged = videosByChannel.flat().map((video) => ({
    ...video,
    channelThumbnailUrl: channelMetaById.get(video.channelId)?.thumbnailUrl ?? video.channelThumbnailUrl,
  }));

  return dedupeById(merged).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
