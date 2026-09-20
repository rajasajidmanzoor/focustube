# FocusTube — Architecture

FocusTube is a personal-use, distraction-free YouTube viewer for Android. It only ever
shows content from channels the user explicitly whitelists. There is no backend; all
state lives on-device.

## Product constraints that drive the architecture

- No downloading/caching of audiovisual content — only metadata is stored locally.
- No scraping — all data comes from the YouTube Data API v3.
- Playback happens through a supported embedded YouTube player (IFrame Player API in a
  WebView) with **no** overlay, control hiding, or interception.
- No search, comments, likes, shares, subscribe controls, or recommendations anywhere
  in the UI.
- Every video/channel shown must be traceable back to a row in the local whitelist.

## Layered structure

```
UI (screens/components)
   -> state (zustand stores)
        -> services/youtube   (YouTube Data API client — network, DTOs, mapping)
        -> services/database  (SQLite repositories — persistence)
   -> hooks (glue: stores + services, exposed to screens as simple hooks)
```

- **UI** never calls services or SQLite directly — it reads/writes through hooks and
  stores only. This keeps screens dumb and testable.
- **Stores (zustand)** hold in-memory app state (current feed, channel list, player
  state) and orchestrate calls to services. They are the only layer allowed to call
  both `services/youtube` and `services/database`.
- **services/youtube** is a thin, typed wrapper around the YouTube Data API v3
  (`channels`, `playlistItems`, `videos` endpoints). It never touches SQLite or React.
- **services/database** wraps `expo-sqlite` behind repository objects
  (`channelsRepository`, `watchHistoryRepository`, `settingsRepository`). It never
  touches the network or React.
- **utils/** are pure functions (duration parsing, relative time formatting, channel
  URL/ID extraction). No side effects.
- **types/** are shared TypeScript types/interfaces used across layers (API DTOs,
  domain models, DB rows).

This separation means the YouTube API or the DB engine could be swapped later without
touching UI code, and vice versa.

## Folder layout

```
focustube/
  src/
    app/                     # expo-router routes (file-based navigation)
      _layout.tsx             # root stack: (tabs) group + video player route
      (tabs)/
        _layout.tsx            # bottom tab bar (Home, Shorts, Channels, Settings)
        index.tsx               # Home tab route -> screens/HomeScreen
        shorts.tsx               # Shorts tab route -> screens/ShortsScreen
        channels.tsx             # Channels tab route -> screens/ChannelsScreen
        settings.tsx             # Settings tab route -> screens/SettingsScreen
      video/[videoId].tsx      # Video player route (pushed from feeds)
    screens/                  # Screen-level composition (route files stay thin)
    components/               # Small, reusable presentational components
    services/
      youtube/                 # YouTube Data API v3 client + DTOs
      database/                # expo-sqlite repositories + schema/migrations
    store/                    # zustand stores
    hooks/                    # React hooks bridging stores/services to screens
    types/                    # Shared TypeScript types
    utils/                    # Pure helper functions
    constants/                # Non-visual constants (API config, storage keys)
    theme/                    # Design tokens + dark theme (see below)
  scripts/
    build-theme.js            # Compiles SCSS tokens -> generated TS theme module
  .env.example                # Documents required env vars (never commit real keys)
```

`expo-router` is configured to use `src/app` as the routes root (already set up by the
project template that was in place before this task). This is functionally identical
to a top-level `app/` directory — it's Expo's documented `src` directory convention —
so it was kept rather than restructured.

## Styling: SCSS design tokens → generated TypeScript theme

React Native does not render CSS/SCSS on native platforms — all native styling is
`StyleSheet.create` JS objects. To honor "define styling globally via SCSS variables
and mixins" while staying within Expo-supported tooling (no unofficial native SCSS
transformers), the pipeline is:

1. `src/theme/scss/_variables.scss` — the single source of truth for color, spacing,
   radius, and font-size tokens (SCSS variables).
2. `src/theme/scss/_mixins.scss` — reusable SCSS mixins, available for any future web
   CSS-module usage (this app targets Android only for V1, but the tokens/mixins stay
   framework-correct SCSS either way).
3. `src/theme/scss/tokens.scss` — `@use`s `_variables.scss` and re-exposes every token
   through a CSS `:export { ... }` block (the standard ICSS export convention).
4. `scripts/build-theme.js` — compiles `tokens.scss` with the `sass` (Dart Sass) npm
   package, parses the `:export` block, and writes `src/theme/tokens.generated.ts`, a
   typed `const` object. This runs automatically before `start`/`android`/`ios`/`web`
   (wired via npm `pre*` script hooks) and can be run manually with `npm run
   theme:build`.
5. `src/theme/theme.ts` — hand-written, imports `tokens.generated.ts` and exposes the
   typed `Theme` object (colors, spacing, radii, typography) that components consume
   via `StyleSheet.create`.

`tokens.generated.ts` is a build artifact (regenerated from SCSS) but is committed so
the project runs immediately after `npm install` without an extra manual step; the
`pre*` script hooks keep it in sync whenever SCSS changes.

The app is **dark-only** (per the V1 "Dark UI" requirement) — there is no light/dark
switching, so the theme module exposes a single palette rather than a light/dark pair.

## Navigation

Bottom tab bar uses expo-router's stable `Tabs` navigator (not the `unstable_native_tabs`
API the starter template shipped with). Reasoning: `unstable_native_tabs` is explicitly
marked unstable and its icons must be either SF Symbols (iOS), Android drawable
resources, or bundled raster images — none of which exist yet for Shorts/Channels/
Settings. The stable `Tabs` navigator with `@expo/vector-icons` gives full control over
a YouTube-like dark tab bar today and can be revisited later if native tab chrome is
wanted.

- `(tabs)` group: Home, Shorts, Channels, Settings — always visible, never a stack.
- `video/[videoId]`: pushed on top of the tab stack when a video is opened, so the tab
  bar and back gesture behave like a normal detail screen (not a modal), matching a
  YouTube-like feel.

## YouTube Data API usage (services/youtube)

Only read-only, quota-light endpoints are used:

- `channels.list` (`forHandle`/`forUsername`/`id`, `part=snippet,contentDetails`) —
  resolve a channel the user adds, and get its "uploads" playlist ID.
- `playlistItems.list` (`playlistId=<uploads playlist>`, `part=snippet,contentDetails`)
  — list a channel's uploaded videos (this is how the whitelist-only feed is built: we
  never call any "search" or "recommended" endpoint).
  - `videos.list` (`part=snippet,contentDetails,statistics`) — batch-fetch duration,
  view count, and thumbnails for videos returned above.

**Shorts detection**: the Data API has no explicit "is this a Short" flag. V1 heuristic:
a video is treated as a Short if its parsed `contentDetails.duration` is ≤ 60 seconds
(matching YouTube's own Shorts definition). This is a metadata-only heuristic — no
scraping involved.

The API key is read from `process.env.EXPO_PUBLIC_YOUTUBE_API_KEY`, populated via a
local `.env` file (gitignored). `.env.example` documents the variable name without a
real value. Because this is a client-only app with no backend, the key still ships
inside the compiled app binary (unavoidable for any pure-client API caller) — the rule
being satisfied is that it never lives in source control or is hardcoded in a tracked
file.

## Local persistence (services/database, expo-sqlite)

Planned tables (created in a future step, tracked in TODO.md):

- `channels` — the whitelist: `id` (YouTube channel ID), `title`, `thumbnail_url`,
  `uploads_playlist_id`, `added_at`.
- `watch_history` — `video_id`, `channel_id`, `title`, `thumbnail_url`, `watched_at`.
- `settings` — simple key/value rows (e.g. last refresh timestamp).

No video/audio bytes are ever persisted — only metadata needed to render the UI offline
between refreshes.

## State management (store/, zustand)

- `channelsStore` — whitelist CRUD, backed by `channelsRepository`; source of truth for
  which channels the feed is allowed to pull from.
- `feedStore` — Home feed (long-form) videos aggregated across whitelisted channels.
- `shortsStore` — Shorts feed, same aggregation with the duration heuristic filter.
- `watchHistoryStore` — recent watch history, backed by `watchHistoryRepository`.
- `settingsStore` — app settings/preferences.

Each store exposes plain async actions (`load`, `refresh`, `add`, `remove`) and derived
state; screens subscribe via small `use*` hooks in `src/hooks/` rather than importing
stores directly, so the store implementation can change without touching screens.

## Compliance mapping (quick reference)

| Rule | How the architecture satisfies it |
|---|---|
| No AV download/cache | `services/database` schema stores metadata only; player streams via embedded YouTube player |
| No scraping | `services/youtube` only calls documented YouTube Data API v3 REST endpoints |
| No bypassing player restrictions | Player screen renders the official YouTube IFrame embed URL in a WebView, unmodified |
| No hidden/overlaid controls | Video player screen adds no overlay views on top of the WebView's player area |
| Whitelist-only content | Feed stores only ever query `playlistItems`/`videos` for channel IDs present in the `channels` table |
| No search/recommendations/comments/etc. | Simply not built — no route, component, or API call exists for any of them |
