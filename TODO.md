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

## Phase 2 — Local persistence (SQLite) ✅ (channels + videos only)

- [x] `src/services/database/db.ts` — lazy `openDatabaseAsync` + migration
      (`channels`, `videos` tables; no `watch_history`/`settings` tables yet — not
      needed until Phase 8/9).
- [x] `src/services/database/channelsRepository.ts` — `listChannels`,
      `getChannelById`, `isChannelAdded`, `addChannel`, `removeChannel`,
      `markChannelSynced`.
- [x] `src/services/database/videosRepository.ts` — `listCachedFeed(filter)`
      (`all`/`long_form`/`shorts`, `INNER JOIN` against `channels`),
      `getCachedVideoById`, `upsertChannelVideos` (upsert, not delete-then-insert).
- [x] `src/types/db.ts` — row types.
- [x] Design decision: removing a channel `DELETE`s the channel row only. Its cached
      video rows are deliberately left untouched (never cascade-deleted) — they just
      stop being selectable because every feed query `INNER JOIN`s against
      `channels`. See db.ts/videosRepository.ts comments.

## Phase 3 — State stores (zustand) — channels + feed + settings done; watch history not started

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
- [ ] `src/store/watchHistoryStore.ts` — not started (Phase 8).
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

## Phase 7 — Video player screen ✅

- [x] `src/components/youtube-player.tsx` — real `react-native-webview` embed of
      `https://www.youtube.com/embed/<id>`. No overlay, no autoplay
      (`mediaPlaybackRequiresUserAction`), default controls untouched.
- [x] `video/[videoId].tsx` looks up the video from SQLite (`getCachedVideoById`) and
      renders the real player + title/channel/relative-publish-date.
- [x] Back navigation returns to the originating feed (native stack back gesture).
- [ ] Record a watch-history entry on open — not started (Phase 8; no
      `watch_history` table yet).

## Phase 8 — Watch history — not started

- [ ] `watch_history` table + repository.
- [ ] Record an entry when the player screen opens.
- [ ] Surface recent history with a clear option (Settings' "Clear watch history" is
      currently a no-op confirmation dialog, since there's nothing to clear yet).

## Phase 9 — Settings screen — UI + Shorts/refresh-interval live; rest not started

- [x] Shorts on/off — live, actually gates the Shorts tab and feed (Phase 6).
- [x] Refresh interval (15/30/60m) — live, actually read by feedStore's staleness
      check (Phase 5/6).
- [x] Clear cache — live, clears the real in-session YouTube lookup cache
      (`clearYouTubeApiCache`).
- [ ] Settings persistence (SQLite `settings` table) — currently zustand-only, resets
      on app restart.
- [ ] Clear watch history — no-op until Phase 8 exists.
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

## Phase 11 — Android build — not started

- [ ] `eas.json` build profile for an installable Android APK.
- [ ] Confirm `EXPO_PUBLIC_YOUTUBE_API_KEY` handling works through EAS builds (EAS
      secret, never committed).
- [ ] Produce and sideload a test APK.
- [ ] Manual on-device verification of vertical Shorts paging, WebView playback, and
      SQLite persistence across app restarts — not yet done; this sandbox has no
      Android SDK/emulator, so only `npx expo export --platform android` (bundle
      compiles, all native modules resolve) has been verified so far.
