export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const YOUTUBE_CHANNEL_PARTS = 'snippet,contentDetails';
export const YOUTUBE_PLAYLIST_ITEM_PARTS = 'snippet';
export const YOUTUBE_VIDEO_PARTS = 'snippet,contentDetails';

/** Videos fetched — and kept cached — per channel. Both the sync fetch size and the
 * SQLite cache cap (see videosRepository.pruneChannelVideos) use this same number,
 * so the cache never holds more than what a fresh sync would fetch anyway. */
export const MAX_UPLOADS_PER_CHANNEL = 50;

/** YouTube's playlistItems.list page size cap is 50 per request. */
export const PLAYLIST_ITEMS_PAGE_SIZE = 50;

/** videos.list accepts at most 50 comma-separated ids per request. */
export const YOUTUBE_BATCH_ID_LIMIT = 50;

/** In-memory (session-only) cache TTL for channel/video lookups — see
 * services/youtube/cache.ts. Durable caching lives in SQLite (services/database). */
export const YOUTUBE_CACHE_TTL_MS = 5 * 60 * 1000;
