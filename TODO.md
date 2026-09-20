# FocusTube — V1 Implementation Plan

Status legend: `[x]` done, `[ ]` not started. See [ARCHITECTURE.md](./ARCHITECTURE.md) for
the reasoning behind each layer.

## Phase 0 — Project scaffold (this step)

- [x] Inspect existing Expo project (SDK 57, expo-router, `src/app` root).
- [x] Write ARCHITECTURE.md and TODO.md.
- [x] Install required dependencies only (`expo-sqlite`, `react-native-webview`,
      `@expo/vector-icons`, `zustand`, `sass`).
- [x] Create the full `src/*` folder structure (components, screens, services/youtube,
      services/database, store, hooks, types, utils, constants, theme).
- [x] SCSS → generated TS theme token pipeline (`src/theme`, `scripts/build-theme.js`).
- [x] Base navigation: stable `Tabs` (Home / Shorts / Channels / Settings) + a
      `video/[videoId]` detail route, dark theme applied.
- [x] Placeholder screens for all four tabs + video player route.
- [x] Remove starter-template demo code that doesn't fit FocusTube (animated splash
      icon, hint rows, web badge, light/dark scheme switching).
- [x] Verify `npx expo start` / `npx expo export` succeed.

## Phase 0.5 — V1 application shell (mock data)

Built the full UI shell for Home, Shorts, Channels, Settings, and the video player
route against realistic mock data (`src/services/youtube/mockData.ts`), so Phase 1
only has to swap the data source, not the UI. Real network calls, persistence, and
zustand stores are still Phase 1–3.

- [x] Reusable `LoadingState` / `EmptyState` / `ErrorState` components, used
      consistently across Home/Shorts/Channels.
- [x] `AppHeader` (title + optional right-side action) on Home/Channels/Settings;
      omitted on Shorts for a full-bleed immersive feed.
- [x] Home: scrolling `VideoCard` feed (thumbnail, duration badge, title, channel
      avatar/name, relative publish date), pull-to-refresh, tap → player.
- [x] Shorts: `FlatList` with `pagingEnabled` + measured container height for
      one-short-at-a-time vertical paging; no comments/share/like affordances.
- [x] Channels: list with avatar/title/added-date, add via modal (`AddChannelModal`),
      remove via confirm `Alert` + swipe-free trash button.
- [x] Settings: Shorts on/off, refresh interval (15/30/60m chips), dark-theme row
      (locked on — see ARCHITECTURE.md dark-only decision), clear cache / clear watch
      history (confirm `Alert`, no-op against real data yet).
- [x] Video player route: mock-data-driven title/channel/thumbnail with a play-icon
      overlay — NOT yet the real WebView embed (still Phase 7).
- [x] `npx tsc --noEmit` and `npx expo lint` clean; `npx expo export --platform
      android` and `npx expo start` verified.

Mock hooks (`useHomeFeed`, `useShortsFeed`, `useChannels`, `useSettings` in
`src/hooks/`) simulate network latency so the loading state is always visible briefly;
the error-state branch is wired into every screen but isn't reachable with the current
always-succeeding mock data — it will start firing naturally once Phase 1 makes real
network calls.

## Phase 1 — YouTube API service layer

- [ ] `src/types/youtube.ts` — DTOs for `channels`, `playlistItems`, `videos` API
      responses (only the fields we use).
- [ ] `src/constants/api.ts` — base URL, endpoint paths, part params.
- [ ] `src/services/youtube/client.ts` — fetch wrapper, injects API key, error
      normalization (network error vs. quota/4xx vs. not-found).
- [ ] `src/services/youtube/channels.ts` — resolve a channel by handle/URL/ID, return
      `{ id, title, thumbnailUrl, uploadsPlaylistId }`.
- [ ] `src/services/youtube/videos.ts` — list uploads for a playlist, batch-fetch video
      details (duration, thumbnails, stats), map to domain `Video` type.
- [ ] `src/utils/duration.ts` — parse ISO-8601 duration, `isShort(durationSeconds)`
      heuristic (≤ 60s).
- [ ] `src/utils/channelInput.ts` — parse a pasted channel URL/handle into whatever
      `channels.list` needs.

## Phase 2 — Local persistence (SQLite)

- [ ] `src/services/database/db.ts` — open/init the `expo-sqlite` database.
- [ ] `src/services/database/migrations.ts` — create `channels`, `watch_history`,
      `settings` tables (see ARCHITECTURE.md schema).
- [ ] `src/services/database/channelsRepository.ts` — list/add/remove whitelist rows.
- [ ] `src/services/database/watchHistoryRepository.ts` — add/list/clear history.
- [ ] `src/services/database/settingsRepository.ts` — get/set key-value settings.
- [ ] `src/types/db.ts` — row types matching the schema.

## Phase 3 — State stores (zustand)

- [ ] `src/store/channelsStore.ts` — whitelist state + CRUD actions.
- [ ] `src/store/feedStore.ts` — Home (long-form) feed aggregation + refresh.
- [ ] `src/store/shortsStore.ts` — Shorts feed aggregation + refresh.
- [ ] `src/store/watchHistoryStore.ts` — history state + actions.
- [ ] `src/store/settingsStore.ts` — settings state + actions.
- [ ] Matching `src/hooks/use*.ts` wrappers exposed to screens.

## Phase 4 — Channels management screen

UI shipped in Phase 0.5 against mock data; remaining work is wiring it to real data:

- [ ] Add-channel input resolves against the real YouTube Data API (currently accepts
      any non-empty text as a mock channel).
- [x] Channel list with remove action (with confirmation).
- [x] Loading/error/empty states.
- [ ] Persist the whitelist via `channelsRepository` (SQLite) instead of component
      state.
- [ ] Removing a channel purges its videos from any in-memory feed immediately.

## Phase 5 — Home feed

UI shipped in Phase 0.5 against mock data; remaining work is wiring it to real data:

- [ ] Aggregate long-form uploads across all whitelisted channels via the real YouTube
      API, sorted by publish date.
- [x] Pull-to-refresh.
- [x] Loading/error/empty states (empty = "no channels added yet" CTA to Channels tab).
- [x] Tapping a video navigates to `video/[videoId]`.

## Phase 6 — Shorts feed

UI shipped in Phase 0.5 against mock data; remaining work is wiring it to real data:

- [ ] Same aggregation as Home, filtered to `isShort` videos, via the real YouTube API.
- [x] Vertical/full-screen paginated layout.
- [x] Loading/error/empty states.

## Phase 7 — Video player screen

- [ ] `video/[videoId].tsx` — replace the current thumbnail-with-play-icon mock with a
      WebView loading the official YouTube embed
      (`https://www.youtube.com/embed/<id>`), default player controls untouched, no
      overlay views.
- [ ] Record a watch-history entry on open.
- [x] Back navigation returns to the originating feed (native stack back gesture).

## Phase 8 — Watch history

- [ ] Surface recent history (likely on Settings or a dedicated section) with clear
      option.
- [ ] No re-fetching of video content — history stores metadata captured at watch time.

## Phase 9 — Settings screen

UI shipped in Phase 0.5 (Shorts toggle, refresh interval, dark-theme row, clear
cache/history) against local component state; remaining work is wiring it to real
data:

- [ ] Persist settings via `settingsRepository` (SQLite) instead of component state.
- [ ] Clear cache / clear watch history actually clear stored data (currently a no-op
      confirmation dialog).
- [ ] Show API key configuration status (configured / missing) without ever
      displaying the key value.
- [ ] App info (version, purpose statement, compliance notes).

## Phase 10 — Polish

- [ ] Consistent loading/error/empty state components reused across Home/Shorts/
      Channels.
- [ ] Pull-to-refresh consistency.
- [ ] Dark theme visual pass (spacing, typography rhythm) using `src/theme` tokens.

## Phase 11 — Android build

- [ ] `eas.json` build profile for an installable Android APK.
- [ ] Confirm `.env` / `EXPO_PUBLIC_YOUTUBE_API_KEY` handling works through EAS builds
      (EAS secret or local `.env`, never committed).
- [ ] Produce and sideload a test APK.
