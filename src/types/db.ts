// SQLite row shapes (services/database) — snake_case, mapped to camelCase domain
// types (Channel, Video) by the repositories before anything else sees them.

export type ChannelRow = {
  id: string;
  title: string;
  handle: string | null;
  thumbnail_url: string;
  uploads_playlist_id: string;
  added_at: string;
  last_synced_at: string | null;
};

export type VideoRow = {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  duration_seconds: number;
  is_short: number;
  cached_at: string;
};

export type VideoWithChannelRow = VideoRow & {
  channel_title: string;
  channel_thumbnail_url: string;
};

export type WatchHistoryRow = {
  video_id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  progress_seconds: number;
  completed: number;
  watched_at: string;
  updated_at: string;
};
