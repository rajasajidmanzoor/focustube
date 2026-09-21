export type WatchHistoryEntry = {
  videoId: string;
  channelId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  progressSeconds: number;
  completed: boolean;
  /** ISO-8601 timestamp of the most recent watch session start. */
  watchedAt: string;
  updatedAt: string;
};
