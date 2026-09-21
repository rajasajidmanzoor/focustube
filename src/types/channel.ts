export type Channel = {
  id: string;
  title: string;
  /** e.g. "@somechannel" — null if the channel has no handle set. */
  handle: string | null;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
  addedAt: string;
  /** ISO-8601 timestamp of the last successful video sync, or null if never synced. */
  lastSyncedAt: string | null;
};
