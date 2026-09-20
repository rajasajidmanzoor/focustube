const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

/** Formats an ISO-8601 timestamp as a short relative time (e.g. "3 hours ago"). */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));

  if (diffSeconds < MINUTE) return 'Just now';
  if (diffSeconds < HOUR) return pluralize(Math.floor(diffSeconds / MINUTE), 'minute');
  if (diffSeconds < DAY) return pluralize(Math.floor(diffSeconds / HOUR), 'hour');
  if (diffSeconds < WEEK) return pluralize(Math.floor(diffSeconds / DAY), 'day');
  if (diffSeconds < MONTH) return pluralize(Math.floor(diffSeconds / WEEK), 'week');
  if (diffSeconds < YEAR) return pluralize(Math.floor(diffSeconds / MONTH), 'month');
  return pluralize(Math.floor(diffSeconds / YEAR), 'year');
}
