export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const YOUTUBE_CHANNEL_PARTS = 'snippet,contentDetails';
export const YOUTUBE_PLAYLIST_ITEM_PARTS = 'snippet';
export const YOUTUBE_VIDEO_PARTS = 'snippet,contentDetails';

/** Videos fetched per channel on a sync — keeps quota/data usage bounded. */
export const MAX_UPLOADS_PER_CHANNEL = 15;

/** YouTube's playlistItems.list page size cap is 50; we default lower since
 * MAX_UPLOADS_PER_CHANNEL is usually well under one page anyway. */
export const PLAYLIST_ITEMS_PAGE_SIZE = 25;

/** videos.list accepts at most 50 comma-separated ids per request. */
export const YOUTUBE_BATCH_ID_LIMIT = 50;

/** In-memory (session-only) cache TTL for channel/video lookups — see
 * services/youtube/cache.ts. Durable caching lives in SQLite (services/database). */
export const YOUTUBE_CACHE_TTL_MS = 5 * 60 * 1000;
