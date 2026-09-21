export type ChannelInputType = 'id' | 'handle' | 'username';

export type ParsedChannelInput = {
  type: ChannelInputType;
  value: string;
};

const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/;

function stripKnownHost(input: string): string {
  return input.replace(/^https?:\/\/(www\.|m\.)?youtube\.com\//i, '').replace(/^\/+/, '');
}

/** Parses a pasted channel URL, @handle, legacy username/custom-URL, or raw channel ID
 * into what channels.list needs. Deliberately does NOT attempt to resolve arbitrary
 * custom URLs via search.list — that would cost far more quota and risk matching the
 * wrong channel; see ARCHITECTURE.md. Unrecognized input falls back to "username" and
 * channels.ts surfaces a clear not-found error if that doesn't resolve. */
export function parseChannelInput(rawInput: string): ParsedChannelInput {
  const trimmed = rawInput.trim();
  const withoutHost = stripKnownHost(trimmed);
  const withoutQuery = withoutHost.split(/[?#]/)[0];
  const segments = withoutQuery.split('/').filter(Boolean);

  if (segments[0] === 'channel' && segments[1]) {
    return { type: 'id', value: segments[1] };
  }
  if (segments[0]?.startsWith('@')) {
    return { type: 'handle', value: segments[0] };
  }
  if ((segments[0] === 'c' || segments[0] === 'user') && segments[1]) {
    return { type: 'username', value: segments[1] };
  }

  // No recognized URL path — evaluate the raw trimmed input directly.
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed };
  }
  if (CHANNEL_ID_PATTERN.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  return { type: 'username', value: trimmed };
}
