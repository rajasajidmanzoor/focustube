import { MAX_UPLOADS_PER_CHANNEL } from '@/constants';
import type { Video, VideoWithChannelRow } from '@/types';

import { getDatabase } from './db';

function mapRow(row: VideoWithChannelRow): Video {
  return {
    id: row.id,
    channelId: row.channel_id,
    channelName: row.channel_title,
    channelThumbnailUrl: row.channel_thumbnail_url,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
    durationSeconds: row.duration_seconds,
    isShort: row.is_short === 1,
  };
}

// INNER JOIN is what makes "removed channels never appear in the feed" true: once a
// channel row is deleted (channelsRepository.removeChannel), its videos stop matching
// this join even though the rows themselves are still in the `videos` table.
const FEED_SELECT = `
  SELECT videos.*, channels.title AS channel_title, channels.thumbnail_url AS channel_thumbnail_url
  FROM videos
  INNER JOIN channels ON channels.id = videos.channel_id
`;

export type VideoFilter = 'all' | 'long_form' | 'shorts';

function whereForFilter(filter: VideoFilter): string {
  if (filter === 'long_form') return 'WHERE videos.is_short = 0';
  if (filter === 'shorts') return 'WHERE videos.is_short = 1';
  return '';
}

export async function getCachedVideoById(id: string): Promise<Video | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<VideoWithChannelRow>(`${FEED_SELECT} WHERE videos.id = ?`, [id]);
  return row ? mapRow(row) : null;
}

/** Reads the locally cached feed — merged across every currently-whitelisted channel,
 * newest first. Deduplication is structural: `videos.id` is a primary key, so a video
 * can never appear twice regardless of how many syncs touched it. */
export async function listCachedFeed(filter: VideoFilter = 'all'): Promise<Video[]> {
  const database = await getDatabase();
  const sql = `${FEED_SELECT} ${whereForFilter(filter)} ORDER BY videos.published_at DESC`;
  const rows = await database.getAllAsync<VideoWithChannelRow>(sql);
  return rows.map(mapRow);
}

/** Upserts a channel's freshly-fetched videos into the cache. Uses INSERT ... ON
 * CONFLICT rather than delete-then-insert so unrelated rows are never touched, and
 * runs as one transaction so a sync is all-or-nothing from the reader's perspective. */
export async function upsertChannelVideos(channelId: string, videos: Video[]): Promise<void> {
  if (videos.length === 0) return;

  const database = await getDatabase();
  const cachedAt = new Date().toISOString();

  await database.withTransactionAsync(async () => {
    for (const video of videos) {
      await database.runAsync(
        `INSERT INTO videos (id, channel_id, title, thumbnail_url, published_at, duration_seconds, is_short, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           thumbnail_url = excluded.thumbnail_url,
           published_at = excluded.published_at,
           duration_seconds = excluded.duration_seconds,
           is_short = excluded.is_short,
           cached_at = excluded.cached_at`,
        [
          video.id,
          channelId,
          video.title,
          video.thumbnailUrl,
          video.publishedAt,
          video.durationSeconds,
          video.isShort ? 1 : 0,
          cachedAt,
        ],
      );
    }
  });
}

/** Caps how many cached videos a single channel can keep (default: the same 50
 * recent uploads a sync fetches — see MAX_UPLOADS_PER_CHANNEL) by deleting the
 * oldest rows beyond that count. Without this, upsertChannelVideos alone would let
 * a channel's row count grow forever, since upsert never removes anything on its
 * own — each sync only re-affirms its own fetched batch. */
export async function pruneChannelVideos(channelId: string, keep: number = MAX_UPLOADS_PER_CHANNEL): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `DELETE FROM videos
     WHERE channel_id = ?
       AND id NOT IN (
         SELECT id FROM videos WHERE channel_id = ? ORDER BY published_at DESC LIMIT ?
       )`,
    [channelId, channelId, keep],
  );
}

/** "Clear cached videos" (Settings) — removes cached video metadata only. Channels,
 * settings, and watch history are untouched; see channelsRepository/
 * watchHistoryRepository/settingsRepository for those. */
export async function clearAllCachedVideos(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM videos');
}
