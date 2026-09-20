export type Video = {
  id: string;
  channelId: string;
  channelName: string;
  channelThumbnailUrl: string;
  title: string;
  thumbnailUrl: string;
  /** ISO-8601 timestamp. */
  publishedAt: string;
  durationSeconds: number;
  /** Duration-based heuristic (<= 60s) — see ARCHITECTURE.md. */
  isShort: boolean;
};
