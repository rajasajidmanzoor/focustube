# FocusTube

A personal-use, distraction-free YouTube viewer for Android. FocusTube only ever shows
videos from YouTube channels you explicitly add to a local whitelist — no search, no
recommendations, no comments, no "trending", nothing outside what you approved.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the app is structured and
[TODO.md](./TODO.md) for the V1 implementation plan/status.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Provide a YouTube Data API v3 key

   ```bash
   cp .env.example .env
   # then edit .env and set EXPO_PUBLIC_YOUTUBE_API_KEY
   ```

   `.env` is gitignored — never commit a real key. Get a key from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with the
   YouTube Data API v3 enabled.

3. Start the app

   ```bash
   npm run android
   ```

   (`npm start` also works if you want to choose a target from the Expo CLI menu.)

## Project scope (V1)

- Home feed and Shorts feed — whitelisted channels only
- Channels management (add/remove)
- Local watch history
- Settings
- Dark UI, embedded YouTube playback

No search, no recommendations, no comments, no likes, no sharing, no subscribe
controls — see ARCHITECTURE.md for why.
