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

// YouTube raised the Shorts length cap from 60s to 3 minutes in October 2024 — using
// the old 60s cutoff here left longer Shorts misclassified as long-form, so they'd
// leak into the Home feed instead of staying in Shorts. Keep this in sync if YouTube
// changes the cap again.
const SHORTS_MAX_DURATION_SECONDS = 180;

/** The single place FocusTube's Shorts heuristic lives — the YouTube Data API has no
 * explicit "is this a Short" flag, so we treat duration <= 3 minutes as a Short
 * (matching YouTube's own current definition). Never duplicate this check elsewhere;
 * always call this. durationSeconds === 0 (e.g. an ongoing livestream) is
 * deliberately excluded. */
export function classifyShort(video: { durationSeconds: number }): boolean {
  return video.durationSeconds > 0 && video.durationSeconds <= SHORTS_MAX_DURATION_SECONDS;
}
