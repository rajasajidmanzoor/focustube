import type { Video, WatchHistoryEntry, WatchHistoryRow } from '@/types';

import { getDatabase } from './db';

function mapRow(row: WatchHistoryRow): WatchHistoryEntry {
  return {
    videoId: row.video_id,
    channelId: row.channel_id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    progressSeconds: row.progress_seconds,
    completed: row.completed === 1,
    watchedAt: row.watched_at,
    updatedAt: row.updated_at,
  };
}

/** Upserts a "watch session started" row — re-watching a video refreshes its
 * position in the history (watched_at) rather than adding a duplicate entry, and
 * resets completed/progress for the new session. */
export async function recordWatchStart(video: Pick<Video, 'id' | 'channelId' | 'title' | 'thumbnailUrl' | 'durationSeconds'>): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO watch_history (video_id, channel_id, title, thumbnail_url, duration_seconds, progress_seconds, completed, watched_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
     ON CONFLICT(video_id) DO UPDATE SET
       title = excluded.title,
       thumbnail_url = excluded.thumbnail_url,
       duration_seconds = excluded.duration_seconds,
       completed = 0,
       watched_at = excluded.watched_at,
       updated_at = excluded.updated_at`,
    [video.id, video.channelId, video.title, video.thumbnailUrl, video.durationSeconds, now, now],
  );
}

/** No-op if the video hasn't been started yet (recordWatchStart wasn't called) —
 * progress only ever updates an existing session. */
export async function updateWatchProgress(videoId: string, progressSeconds: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE watch_history SET progress_seconds = ?, updated_at = ? WHERE video_id = ?', [
    Math.max(0, Math.floor(progressSeconds)),
    new Date().toISOString(),
    videoId,
  ]);
}

export async function markWatchCompleted(videoId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE watch_history SET completed = 1, updated_at = ? WHERE video_id = ?', [
    new Date().toISOString(),
    videoId,
  ]);
}

export async function listWatchHistory(): Promise<WatchHistoryEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<WatchHistoryRow>('SELECT * FROM watch_history ORDER BY watched_at DESC');
  return rows.map(mapRow);
}

export async function clearWatchHistory(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM watch_history');
}
