# FocusTube — Security Model

FocusTube is a personal-use, client-only Android app with no backend server. This
document explains what data it touches, how the YouTube API key is handled, and the
concrete guarantees (and limits) of that setup. See [ARCHITECTURE.md](./ARCHITECTURE.md)
for the broader system design.

## Data this app touches

- **YouTube metadata** (titles, thumbnails, durations, channel names/avatars) fetched
  read-only from the [YouTube Data API v3](https://developers.google.com/youtube/v3).
  Cached locally in SQLite (`services/database`) so the app works offline between
  syncs.
- **Video playback** happens entirely inside YouTube's own embedded player (the
  official IFrame Player API, loaded via WebView — `components/youtube-player.tsx`).
  FocusTube never downloads, extracts, proxies, or stores audiovisual content, and
  never scrapes YouTube's HTML — every video/channel fact comes from the Data API's
  JSON responses.
- **Local app state**: the channel whitelist, cached video metadata, watch history,
  and settings all live in an on-device SQLite database (`focustube.db`). None of it
  ever leaves the device — there is no backend to send it to.

## The YouTube API key

- Read from `process.env.EXPO_PUBLIC_YOUTUBE_API_KEY`, set via a local `.env` file
  (see `.env.example`). `.env` is listed in `.gitignore` and has never been committed
  to this repository.
- The key is a plain **API key** scoped to read-only public endpoints
  (`channels.list`, `playlistItems.list`, `videos.list`). FocusTube never requests
  OAuth, never asks for a user's Google account, and never touches any endpoint that
  would require it (no private playlists, no subscriptions, no user data).
- `services/youtube/youtubeApi.ts` is the only place the key is read or attached to a
  request (as a URL query parameter, over HTTPS). It is never logged, never included
  in a thrown error's message, and never rendered in the UI —
  `isYouTubeApiConfigured()` exists specifically so a future Settings status row can
  say "configured" / "missing" without ever exposing the value itself.

### The one limitation worth being explicit about

`EXPO_PUBLIC_`-prefixed environment variables are inlined into the compiled JS bundle
at build time — this is how Expo makes them readable at runtime in a client with no
backend, and it's unavoidable for this architecture. **"Never committed to Git" and
"cannot be recovered from the installed app" are different guarantees.** Someone who
decompiles the built APK can recover the key string. This is a property of shipping
any API key in a pure-client app, not a defect in FocusTube's code.

**Mitigation** (do this in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
not in code):
1. Restrict the key to the **YouTube Data API v3** only.
2. Add an **Android application restriction** — the app's package name
   (`focustube` / whatever you set in `app.json`) plus its release-signing
   certificate's SHA-1 fingerprint.

With both restrictions in place, an extracted key is useless outside a build signed
with your own certificate.

## Network

- Every request FocusTube makes is HTTPS: the YouTube Data API base URL
  (`https://www.googleapis.com/youtube/v3`) and the YouTube IFrame Player embed
  (`https://www.youtube.com/...`). There are no `http://` requests anywhere in the
  codebase.
- No third-party analytics, crash reporting, or telemetry SDKs are integrated —
  network traffic is limited to the two things above.

## Error handling

`YouTubeApiError` (`services/youtube/youtubeApi.ts`) is the single place API failures
are normalized. Its `message` is **always text this codebase wrote itself** — never
the raw API key, a full request URL, or Google's own free-text error body. This is
enforced structurally: `youtubeGet()`'s error path only ever extracts a `reason`/
`status` code from Google's response (for detecting quota errors) and discards the
free-text `error.message` field entirely, substituting our own generic strings. UI
code (e.g. `toFriendlyChannelError` in `store/channelsStore.ts`) can therefore display
any `YouTubeApiError.message` directly without a second sanitization pass.

## Logging

FocusTube contains no `console.log`/`console.warn`/`console.error` calls in
application code — there is no debug-logging surface to accidentally print a secret
to. (A temporary diagnostic `console.log` was added once during development to debug
a WebView playback issue and was removed before landing.) Release builds also get
Expo/Hermes's standard stripping of development-only code, and there is no custom
debug-mode flag (`__DEV__` or otherwise) gating any logging in this app.

## Android permissions

`app.json` declares no explicit Android permissions. None of FocusTube's dependencies
(`expo-sqlite`, `react-native-webview`, `expo-image`, `expo-web-browser`, etc.)
require sensitive runtime permissions (camera, microphone, location, contacts,
storage) for the features FocusTube actually uses. The only implicit permission is
internet access, required for any app that makes network requests.

## What FocusTube deliberately does not do

Restated from [ARCHITECTURE.md](./ARCHITECTURE.md)'s compliance table, because they're
security-relevant too:

- No scraping of YouTube's HTML pages.
- No extraction of direct/streamable media URLs — playback is 100% delegated to
  YouTube's own embedded player.
- No downloading or local storage of audio/video bytes.
- No OAuth, no sign-in, no access to any user's private YouTube data.
- No modification of, or overlay on top of, the YouTube player's own controls.

## Reporting a concern

This is a personal-use project without a public bug bounty process. If you find a
security issue while working on this codebase, treat it the same way as any other
bug: fix it, and if it involves a credential that may have already been exposed
(e.g. an API key accidentally committed), rotate that credential in the Google Cloud
Console immediately, independent of any code fix.
