# FocusTube — V1 Implementation Plan

Status legend: `[x]` done, `[ ]` not started. See [ARCHITECTURE.md](./ARCHITECTURE.md) for
the reasoning behind each layer.

## Phase 0 — Project scaffold

- [x] Inspect existing Expo project (SDK 57, expo-router, `src/app` root).
- [x] Write ARCHITECTURE.md and TODO.md.
- [x] Install required dependencies only (`expo-sqlite`, `react-native-webview`,
      `@expo/vector-icons`, `zustand`, `sass`).
- [x] Create the full `src/*` folder structure (components, screens, services/youtube,
      services/database, store, hooks, types, utils, constants, theme).
- [x] SCSS → generated TS theme token pipeline (`src/theme`, `scripts/build-theme.js`).
- [x] Base navigation: stable `Tabs` (Home / Shorts / Channels / Settings) + a
      `video/[videoId]` detail route, dark theme applied.
- [x] Remove starter-template demo code that doesn't fit FocusTube.
- [x] Verify `npx expo start` / `npx expo export` succeed.

## Phase 0.5 — V1 application shell

Built with mock data first, then fully rewired to the real pipeline in later phases —
no mock data remains in the app (`src/services/youtube/mockData.ts` and
`useMockVideoFeed.ts` were deleted once Home/Shorts/Channels all moved to real data).

- [x] Reusable `LoadingState` / `EmptyState` / `ErrorState` components.
- [x] `AppHeader` on Home/Channels/Settings; omitted on Shorts for a full-bleed feed.

## Phase 1 — YouTube API service layer ✅

- [x] `src/types/youtube.ts` — DTOs for `channels`, `playlistItems`, `videos` (only
      the fields FocusTube reads).
- [x] `src/constants/api.ts` — base URL, part params, page/batch size limits, cache TTL.
- [x] `src/services/youtube/youtubeApi.ts` — fetch wrapper, `getYouTubeApiKey()` /
      `isYouTubeApiConfigured()` config validation, `YouTubeApiError` (kinds: config,
      network, quota, not_found, http, malformed_response), `chunkArray`,
      `pickThumbnailUrl`.
- [x] `src/services/youtube/cache.ts` — in-memory session TTL cache (avoids redundant
      calls; durable caching is SQLite, see Phase 2).
- [x] `src/services/youtube/channels.ts` — `resolveChannel(input)` (URL/@handle/ID/
      legacy username, via `channels.list` only — never `search.list`),
      `getChannelUploadsPlaylist(channelId)`, `getChannelsMetaById(ids)` (batched, ≤50
      ids per call).
- [x] `src/services/youtube/playlists.ts` — `getPlaylistVideoRefs(playlistId,
      maxResults)`, paginated via `nextPageToken`, capped at `maxResults`.
- [x] `src/services/youtube/videos.ts` — `getVideosByIds` (batched, ≤50 ids/call),
      `getChannelVideos(channelId)`, `getApprovedChannelFeed(channelIds)` (merge +
      dedupe + sort, direct-from-API view — the app's actual feed is SQLite-backed,
      see Phase 5/6).
- [x] `src/utils/duration.ts` — `parseIso8601Duration`, `classifyShort` (single
      source of truth for the ≤60s Shorts heuristic — never duplicated elsewhere).
- [x] `src/utils/parseChannelInput.ts` — URL/@handle/ID/username parsing.
- [x] Tested against the **live** YouTube Data API (handle resolution, full-URL
      resolution, `/channel/UC…` resolution, video fetch + correct Shorts
      classification, not-found and empty-input errors) and against **mocked**
      failure responses (quota exceeded, network failure, malformed JSON, missing API
      key) — all produced the correct `YouTubeApiError.kind` and a friendly message.

## Phase 2 — Local persistence (SQLite) ✅

- [x] `src/services/database/db.ts` — lazy `openDatabaseAsync` + migration
      (`channels`, `videos`, `watch_history`, `settings` tables).
- [x] `src/services/database/settingsRepository.ts` — generic JSON-encoded
      `getSetting`/`setSetting` key-value store, backing `store/settingsStore.ts`.
- [x] `src/services/database/channelsRepository.ts` — `listChannels`,
      `getChannelById`, `isChannelAdded`, `addChannel`, `removeChannel`,
      `markChannelSynced`.
- [x] `src/services/database/videosRepository.ts` — `listCachedFeed(filter)`
      (`all`/`long_form`/`shorts`, `INNER JOIN` against `channels`),
      `getCachedVideoById`, `upsertChannelVideos` (upsert, not delete-then-insert).
- [x] `src/services/database/watchHistoryRepository.ts` — see Phase 8.
- [x] `src/types/db.ts` — row types.
- [x] Design decision: removing a channel `DELETE`s the channel row only. Its cached
      video rows are deliberately left untouched (never cascade-deleted) — they just
      stop being selectable because every feed query `INNER JOIN`s against
      `channels`. See db.ts/videosRepository.ts comments.

## Phase 3 — State stores (zustand) ✅

- [x] `src/store/channelsStore.ts` — whitelist state, `previewChannel` (resolve +
      duplicate check, no write), `confirmChannel` (save + initial sync),
      `removeChannel`.
- [x] `src/store/feedStore.ts` — **one shared store** for both Home and Shorts (holds
      all cached videos; each screen filters client-side) — cached-first load,
      staleness-aware background refresh, force-refresh for pull-to-refresh,
      in-flight guard so Home/Shorts never double-sync.
- [x] `src/store/sync.ts` — `syncChannel(channelId)`: the one place that bridges
      services/youtube + services/database (fetch → upsert → mark synced).
- [x] `src/store/settingsStore.ts` — `shortsEnabled`, `refreshIntervalMinutes` (local
      only — not yet persisted, see Phase 9).
- [x] Watch history has no separate store — `useWatchProgress` (Phase 8) calls
      `watchHistoryRepository` directly, since nothing else needs to read that state
      reactively yet. Worth promoting to a store if/when a history screen is built.
- [x] Matching `src/hooks/use*.ts` wrappers exposed to screens.

## Phase 4 — Channels management screen ✅

- [x] Add Channel is a 2-step modal (`add-channel-modal.tsx`): input → resolve via
      real YouTube API → confirmation preview (thumbnail, name, handle) → confirm →
      save to SQLite → initial sync → return to Channels screen.
- [x] Duplicate prevention (`channelsStore.previewChannel` checks the current
      whitelist before allowing confirm).
- [x] Friendly, non-technical errors for not-found and quota-exceeded
      (`toFriendlyChannelError`) — never a raw status code or quota reason string.
- [x] Channels screen displays thumbnail, name, handle (if available), last-synced
      time, and an "Active" status badge.
- [x] Remove via trash-icon button + confirm `Alert`.
- [x] Removed channels never reappear in Home/Shorts (INNER JOIN, see Phase 2); their
      cached videos are left in place per the repository design above.

## Phase 5 — Home feed ✅

- [x] Pipeline: approved active channels → YouTube API → normalized videos → SQLite
      upsert → shared feedStore → Home screen.
- [x] Only active (currently-whitelisted) channels ever appear.
- [x] Newest videos first (`ORDER BY published_at DESC`).
- [x] Deduplicated structurally (`videos.id` is a SQLite primary key).
- [x] Pull-to-refresh (force-syncs every channel).
- [x] Cached content shown immediately; background sync only for stale channels
      (per the settings refresh interval) — avoids unnecessary API calls.
- [x] Distinct states: first-launch loading, no-channels empty, channels-but-no-videos
      empty (with a syncing variant), friendly network/quota error with retry.
- [x] Tapping a video navigates to `video/[videoId]`.

## Phase 6 — Shorts feed ✅

- [x] Same shared feedStore as Home, filtered to `isShort` — no separate sync, so
      opening both tabs never double-fetches the same channels.
- [x] Full-screen vertical `FlatList` (`pagingEnabled`, measured container height,
      snap-to-interval).
- [x] Displays title, channel name, channel thumbnail; no comments/share/like/
      subscribe UI.
- [x] Nearby-item thumbnail prefetching via `onViewableItemsChanged` +
      `Image.prefetch` (all metadata is already in memory from SQLite — only the
      thumbnail image bytes benefit from prefetching).
- [x] Respects the Shorts-enabled setting: tab is hidden from the bar (`href: null`)
      and the screen shows an explanatory state if reached directly.
- [x] Loading/empty (no channels vs. no Shorts yet)/error+retry states.
- [x] Tapping a Short opens the same real player as Home (see Phase 7) — deliberately
      not an inline autoplaying card, since the product rule against covering/
      replacing YouTube's own controls rules out a custom overlaid Shorts player.

## Phase 7 — Video player screen ✅ (code complete; playback unverified on this emulator)

- [x] `src/components/youtube-player.tsx` — real YouTube IFrame Player API (the
      currently-supported embedded playback mechanism), loaded via
      `react-native-webview` with `baseUrl: 'https://www.youtube.com'` (required —
      without it the player rejects playback with its own "configuration error"
      screen) and a standard Chrome Mobile user agent (avoids WebView-specific
      restrictions some Google services apply to the default embedded-WebView UA).
      No overlay, no autoplay (`mediaPlaybackRequiresUserAction={false}` only
      permits it, doesn't trigger it — nothing sets `autoplay: 1`), default controls
      untouched; YouTube's own error screens (e.g. "This video is unavailable") are
      left to render through unmodified rather than being covered by our UI.
- [x] `video/[videoId].tsx` looks up the video from SQLite (`getCachedVideoById`),
      distinguishes not-found vs. a genuine lookup failure (retryable `ErrorState`),
      and renders the real player + title/channel/relative-publish-date.
- [x] `src/hooks/useWatchProgress.ts` + `watchHistoryRepository.ts` (`watch_history`
      table exists) — records a watch session on first `playing` state, throttles
      progress writes to every 5s, marks `completed` on `ended`.
- [x] Back navigation returns to the originating feed (native stack back gesture).
- [x] Handles invalid video ID (not-found state), network/lookup failure (retryable
      error state), and player load failure (WebView nav error + a 15s no-`onReady`
      timeout), each with its own `ErrorState`/retry.

**Known issue — not an app bug**: on the Android emulator used for on-device testing
(Pixel 7a AVD, x86_64, `google_apis_playstore` system image), every video fails with
YouTube's own "Error code: 152" inside the player. Diagnosed with instrumented
logging (temporarily added, then removed) showing the full JS/page layer succeeds —
origin is correct, the IFrame API script loads, `YT.Player` constructs, and `onReady`
fires — and the failure happens deterministically ~0ms after `onReady`, before any
user interaction, right at video/stream negotiation. A direct EME probe
(`navigator.requestMediaKeySystemAccess('com.widevine.alpha', …)`) showed Widevine is
present and its CDM actively initializes (real `WVCdm`/`DrmUtils` logs, L3 software
level) but the promise never resolves or rejects — the CDM negotiation itself hangs.
This matches a known, documented category of issue with Widevine's software CDM
specifically on **x86_64** Android emulator images (the CDM binaries are frequently
ARM-oriented and behave unreliably under x86_64 emulation), separate from "emulators
have no DRM at all." The same video opened directly in the emulator's own full Chrome
browser also hung indefinitely, confirming it's environmental, not
WebView-configuration-specific.
Next step to actually confirm playback: test on a physical Android device, or an
ARM64 emulator image if the host supports one.

## Phase 8 — Watch history ✅ (recording done; no dedicated history screen yet)

- [x] `watch_history` table (`services/database/db.ts`) + repository
      (`watchHistoryRepository.ts`: `recordWatchStart`, `updateWatchProgress`,
      `markWatchCompleted`, `listWatchHistory`, `clearWatchHistory`).
- [x] Record an entry when the player screen opens (`useWatchProgress` hook, wired
      into `VideoPlayerScreen`).
- [x] Settings' "Clear watch history" now actually clears it (`clearWatchHistory`).
- [ ] A dedicated screen/section to browse recent history — not built yet;
      `listWatchHistory()` is ready for one.

## Phase 9 — Settings screen — Shorts/refresh-interval/clear-cache/clear-history live; rest not started

- [x] Shorts on/off — live, actually gates the Shorts tab and feed (Phase 6).
- [x] Refresh interval (15/30/60m) — live, actually read by feedStore's staleness
      check (Phase 5/6).
- [x] Clear cache — live, clears the real in-session YouTube lookup cache
      (`clearYouTubeApiCache`).
- [x] Clear watch history — live (see Phase 8).
- [ ] Settings persistence (SQLite `settings` table) — currently zustand-only, resets
      on app restart.
- [ ] Show API key configuration status (configured/missing), never the key value —
      `isYouTubeApiConfigured()` already exists in services/youtube for this.
- [ ] App info (version, purpose statement, compliance notes).

## Phase 10 — Polish

- [x] Consistent loading/error/empty state components reused across Home/Shorts/
      Channels.
- [x] Pull-to-refresh consistency (Home; Shorts intentionally omits pull-to-refresh
      to avoid fighting the vertical paging gesture — relies on the shared
      background sync + Retry instead).
- [ ] Further dark theme visual pass.

## Phase 11 — Android build ✅ (config complete; first real EAS build not yet run)

- [x] `app.json` configured for a real build: display name "FocusTube", package
      `com.focustube.personal`, `versionCode` 1, dark-only adaptive icon background,
      dark splash screen — see BUILD.md.
- [x] `eas.json` with `development`/`preview`/`production` profiles, all
      `android.buildType: "apk"` (never AAB), all `distribution: "internal"`, no
      `submit` block anywhere — Google Play submission is not configured.
      `expo-dev-client` installed for the `development` profile.
- [x] Documented `EXPO_PUBLIC_YOUTUBE_API_KEY` handling through EAS builds (EAS
      Environment Variables, never committed) — see BUILD.md.
- [x] Configuration validation: `npx expo-doctor` — 21/21 checks passed.
      `npx eas-cli config` requires an authenticated `eas login`, which isn't
      available in this environment — documented as a required manual step before
      the first real build.
- [ ] Actually run `eas build --profile production` and sideload the result — not
      done here (needs the user's own Expo account).
- [x] Manual on-device verification via an Android emulator (Pixel 7a AVD) of: full
      Add Channel workflow against the live API, SQLite persistence across app
      restarts, Home/Shorts pipeline, Settings (Hide Shorts, session limit,
      confirmations), and the video player (see Phase 7's Widevine finding for the
      one unresolved item — needs a physical device).

## Phase 12 — Distraction-control rules & robust caching ✅

Both were already true structurally (no search/trending/recommendations/etc. exist —
they were simply never built, and every feed query is scoped to the `channels`
table), but this phase added the pieces that needed real logic:

- [x] After a video ends, FocusTube never lets YouTube's own "up next" endscreen
      linger — `VideoPlayerScreen` navigates back to the originating feed the instant
      `onStateChange` reports `'ended'` (`router.back()`, falling back to `/` if
      there's no back history).
- [x] "Hide Shorts" setting (renamed from the earlier "Shorts enabled" toggle),
      **default true** — Shorts starts hidden (tab + feed) until the user opts in.
- [x] "Maximum Shorts per session" (Unlimited/5/10/20/50/100, default Unlimited) —
      `ShortsScreen` truncates the paginated list at the limit and appends a
      `ShortsLimitCard` sentinel item ("You've reached your Shorts limit." / "Back to
      Videos" / "Continue Anyway") so the next swipe lands on it naturally, no scroll
      hijacking required. "Continue Anyway" lifts the cap for the rest of that Shorts
      tab visit (resets on remount — a "session").
- [x] Both settings (plus `refreshIntervalMinutes`) persist to the new `settings`
      SQLite table via `settingsStore.hydrate()` (called once from the root layout)
      and per-setter writes.
- [x] Cache cap: `MAX_UPLOADS_PER_CHANNEL` raised to the spec'd 50 and now doubles as
      the SQLite retention cap — `videosRepository.pruneChannelVideos` deletes rows
      beyond the newest 50 per channel after every sync, so the cache can't grow
      unbounded.
- [x] "Last updated" indicator on Home (`Updated 5 minutes ago`, from the most recent
      per-channel `last_synced_at`).
- [x] Pull-to-refresh cooldown (10s) so rapid repeated pulls can't turn into repeated
      API calls — "subject to API limits."
- [x] Settings → "Clear cached videos" (`videosRepository.clearAllCachedVideos`),
      confirmation text exactly "Clear cached video metadata?" — clears only the
      `videos` table (+ the in-memory YouTube lookup cache); channels, settings, and
      watch history are untouched.
- [x] Verified on-device: Hide Shorts toggle immediately shows/hides the tab; Home's
      "Updated N minutes ago" renders; Maximum Shorts per session chips select
      correctly; hitting the limit shows the interstitial with working Back to
      Videos / Continue Anyway.
