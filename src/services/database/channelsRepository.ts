import type { Channel, ChannelRow } from '@/types';

import { getDatabase } from './db';

function mapRow(row: ChannelRow): Channel {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
    thumbnailUrl: row.thumbnail_url,
    uploadsPlaylistId: row.uploads_playlist_id,
    addedAt: row.added_at,
    lastSyncedAt: row.last_synced_at,
  };
}

/** Every whitelisted channel, newest-added first. A channel returned here is, by
 * definition, part of the active whitelist — there's no separate "active" flag; see
 * removeChannel(). */
export async function listChannels(): Promise<Channel[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ChannelRow>('SELECT * FROM channels ORDER BY added_at DESC');
  return rows.map(mapRow);
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ChannelRow>('SELECT * FROM channels WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function isChannelAdded(id: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ id: string }>('SELECT id FROM channels WHERE id = ?', [id]);
  return row !== null;
}

export type NewChannel = {
  id: string;
  title: string;
  handle: string | null;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
};

export async function addChannel(input: NewChannel): Promise<Channel> {
  const database = await getDatabase();
  const addedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO channels (id, title, handle, thumbnail_url, uploads_playlist_id, added_at, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [input.id, input.title, input.handle, input.thumbnailUrl, input.uploadsPlaylistId, addedAt],
  );

  return { ...input, addedAt, lastSyncedAt: null };
}

/** Removes a channel from the whitelist. Deliberately does NOT touch the `videos`
 * table — already-cached videos for this channel are left in place (see
 * videosRepository.ts) and simply stop appearing in any feed query, since those
 * queries INNER JOIN against `channels`. */
export async function removeChannel(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM channels WHERE id = ?', [id]);
}

export async function markChannelSynced(id: string, syncedAt: string = new Date().toISOString()): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE channels SET last_synced_at = ? WHERE id = ?', [syncedAt, id]);
}
