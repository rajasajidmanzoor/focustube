import { YOUTUBE_API_BASE_URL } from '@/constants';
import type { YouTubeApiErrorResponse, YouTubeThumbnails } from '@/types';

export type YouTubeApiErrorKind = 'config' | 'network' | 'quota' | 'not_found' | 'http' | 'malformed_response';

/** Every failure from the YouTube service layer surfaces as this, so callers (hooks/
 * stores/UI) can branch on `kind` instead of parsing message strings. `message` is
 * always a string we wrote ourselves — this file never puts the API key, a raw
 * request URL, or Google's own free-text error body into it, so any caller can show
 * `message` directly in the UI without a second sanitization pass. */
export class YouTubeApiError extends Error {
  readonly kind: YouTubeApiErrorKind;
  readonly status?: number;

  constructor(kind: YouTubeApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'YouTubeApiError';
    this.kind = kind;
    this.status = status;
  }
}

/** Configuration validation: throws a clear, actionable error if the API key isn't
 * set, instead of letting every request fail with an opaque 400 from Google. */
export function getYouTubeApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new YouTubeApiError(
      'config',
      'YouTube API key is not configured. Copy .env.example to .env, set EXPO_PUBLIC_YOUTUBE_API_KEY, and restart the dev server.',
    );
  }
  return apiKey;
}

/** For UI use (e.g. a Settings status row) — never returns or logs the key itself. */
export function isYouTubeApiConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_YOUTUBE_API_KEY?.trim());
}

const QUOTA_REASONS = new Set(['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded', 'userRateLimitExceeded']);

/** Only extracts the `reason`/`status` code from the error body — deliberately never
 * returns Google's free-text `error.message`. That text is meant for developers
 * reading Google's own docs, not guaranteed safe to show end users, and callers of
 * `youtubeGet` must never forward arbitrary upstream text into the UI (see
 * SECURITY.md "API errors"). */
async function parseErrorReason(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as YouTubeApiErrorResponse;
    return body.error?.errors?.[0]?.reason ?? body.error?.status;
  } catch {
    return undefined;
  }
}

/** Low-level GET against the YouTube Data API v3. Injects the API key, never surfaces
 * it (or any request URL) in a thrown error, and normalizes every failure mode
 * (network, HTTP, quota, malformed JSON) into a `YouTubeApiError`. */
export async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = getYouTubeApiKey();

  const url = new URL(`${YOUTUBE_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new YouTubeApiError('network', 'Could not reach YouTube. Check your connection and try again.');
  }

  if (!response.ok) {
    const reason = await parseErrorReason(response);

    if (response.status === 403 && reason && QUOTA_REASONS.has(reason)) {
      throw new YouTubeApiError(
        'quota',
        'YouTube API quota has been used up for today. Try again later.',
        response.status,
      );
    }
    if (response.status === 404) {
      throw new YouTubeApiError('not_found', 'The requested YouTube resource could not be found.', response.status);
    }
    // Every other non-OK status: a deliberately generic message. Never forward
    // Google's raw error text here — see parseErrorReason's doc comment.
    throw new YouTubeApiError('http', 'YouTube returned an error. Please try again.', response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new YouTubeApiError('malformed_response', 'YouTube returned an unexpected response. Try again.');
  }
}

/** Splits an array into chunks of at most `size` — used for videos.list/channels.list
 * batch id lookups (both cap at 50 ids per request). */
export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Picks the best available thumbnail URL, preferring higher resolutions. */
export function pickThumbnailUrl(thumbnails: YouTubeThumbnails | undefined): string {
  if (!thumbnails) return '';
  return (
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.standard?.url ??
    thumbnails.maxres?.url ??
    thumbnails.default?.url ??
    ''
  );
}
