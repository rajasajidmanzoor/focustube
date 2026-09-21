const ISO_8601_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

/** Parses a YouTube API ISO-8601 duration (e.g. "PT4M13S") into whole seconds.
 * Returns 0 for unparseable input (e.g. "P0D", used for ongoing livestreams). */
export function parseIso8601Duration(duration: string): number {
  const match = ISO_8601_DURATION_PATTERN.exec(duration);
  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

const SHORTS_MAX_DURATION_SECONDS = 60;

/** The single place FocusTube's Shorts heuristic lives — the YouTube Data API has no
 * explicit "is this a Short" flag, so we treat duration <= 60s as a Short (matching
 * YouTube's own definition). Never duplicate this check elsewhere; always call this.
 * durationSeconds === 0 (e.g. an ongoing livestream) is deliberately excluded. */
export function classifyShort(video: { durationSeconds: number }): boolean {
  return video.durationSeconds > 0 && video.durationSeconds <= SHORTS_MAX_DURATION_SECONDS;
}
