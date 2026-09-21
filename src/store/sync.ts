import { markChannelSynced, upsertChannelVideos } from '@/services/database';
import { getChannelVideos } from '@/services/youtube';
import type { Video } from '@/types';

/** Fetches a channel's recent uploads from YouTube, upserts them into the local
 * SQLite cache, and stamps the channel's last-synced time. This is the one place
 * that bridges services/youtube and services/database — per ARCHITECTURE.md, stores
 * are the only layer allowed to call both. Both channelsStore (new-channel initial
 * sync) and feedStore (background/pull-to-refresh) call this — never duplicate this
 * sequence elsewhere. */
export async function syncChannel(channelId: string): Promise<Video[]> {
  const videos = await getChannelVideos(channelId);
  await upsertChannelVideos(channelId, videos);
  await markChannelSynced(channelId);
  return videos;
}
