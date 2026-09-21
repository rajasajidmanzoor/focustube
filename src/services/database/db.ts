import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'focustube.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      handle TEXT,
      thumbnail_url TEXT NOT NULL,
      uploads_playlist_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      last_synced_at TEXT
    );

    -- No FOREIGN KEY/CASCADE here on purpose: removing a channel must not delete its
    -- already-cached videos immediately (see ARCHITECTURE.md and
    -- videosRepository.ts). Feed queries INNER JOIN against channels, so a removed
    -- channel's videos simply stop being selectable — they're just not cleaned up
    -- right away.
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY NOT NULL,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      is_short INTEGER NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos (channel_id);
    CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos (published_at);

    -- One row per video ever watched (re-watching upserts the same row rather than
    -- growing a log) — metadata + playback position only, never the video itself.
    CREATE TABLE IF NOT EXISTS watch_history (
      video_id TEXT PRIMARY KEY NOT NULL,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      progress_seconds INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      watched_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history (watched_at);
  `);
}

/** Lazily opens (once per app run) and migrates the local SQLite database. Metadata
 * only — no audiovisual content is ever stored here (see ARCHITECTURE.md). */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await migrate(database);
      return database;
    });
  }
  return databasePromise;
}
