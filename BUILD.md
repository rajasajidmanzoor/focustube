# FocusTube — Android Build Guide

FocusTube is distributed as a sideloaded APK for personal use only — **no Google Play
submission is configured anywhere in this project.** This document covers building,
installing, and versioning the app. See [SECURITY.md](./SECURITY.md) for why the
YouTube API key is handled the way it is below.

## Prerequisites

- A free [Expo account](https://expo.dev/signup).
- EAS CLI — no local install needed, invoked on demand via `npx eas-cli`.
- `adb` (Android SDK Platform Tools) on your `PATH` if you want to install via cable
  instead of downloading the APK straight to your phone.

```bash
npx eas-cli login   # once per machine
```

## Build profiles (`eas.json`)

| Profile | Purpose | Output | Distribution |
|---|---|---|---|
| `development` | On-device development with Fast Refresh and the dev menu (via `expo-dev-client`) — for testing beyond what Expo Go covers | `.apk` | internal |
| `preview` | A release-like build for testing on a real device before calling something done | `.apk` | internal |
| `production` | **The personal release** — what you actually install and use day to day | `.apk` | internal |

All three build an installable **`.apk`**, never an `.aab`/App Bundle
(`android.buildType: "apk"` on every profile). All three use
`"distribution": "internal"` rather than `"store"`, and there is no `submit` block in
`eas.json` — this project cannot accidentally get pushed to Google Play from here.

## Environment variables

FocusTube reads `EXPO_PUBLIC_YOUTUBE_API_KEY` at build time (it gets inlined into the
JS bundle — see SECURITY.md for what that does and doesn't guarantee).

- **Local development** (`npx expo start`, `npx expo run:android`): create a `.env`
  file from `.env.example`. `.env` is gitignored and never uploaded anywhere by these
  commands.
- **EAS cloud builds**: `.env` is *not* sent to EAS. Set the variable once per
  environment using EAS's own Environment Variables feature (each environment name
  matches the `eas.json` profile of the same name, so no extra wiring is needed):

  ```bash
  npx eas-cli env:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value "YOUR_KEY" --environment development
  npx eas-cli env:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value "YOUR_KEY" --environment preview
  npx eas-cli env:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value "YOUR_KEY" --environment production
  ```

  Never put the real key directly in `eas.json` or `app.json` — both are committed to
  git.

## Build commands

```bash
npx eas-cli build --platform android --profile development
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

Each uploads the project, builds in EAS's cloud, and prints a download link + QR code
for the resulting APK when it finishes. A `development` build also needs a dev server
running to connect to (`npx expo start --dev-client`) — it's an installable shell, not
a finished standalone app.

## Installation procedure (sideloading)

1. Get the APK onto your device — either open the EAS build link / scan the QR code
   directly on the phone, or pull it to your machine and push it over:
   ```bash
   npx eas-cli build:download --platform android   # prompts you to pick the build
   adb install -r focustube.apk
   ```
2. The first time, Android will prompt to allow "Install unknown apps" for whichever
   app you used to open the file (browser, file manager) — that's a per-source
   permission, not a system-wide setting, and only needs granting once.
3. **Reinstalling/updating**: an APK with a higher `android.versionCode` (see below)
   installs right over the previous one and keeps your local data — approved
   channels, watch history, settings all live in the on-device SQLite database and
   are untouched by an app update. A same-or-lower `versionCode` gets rejected by
   Android with "App not installed."

## Version bump procedure

Two numbers in `app.json` matter, and `eas.json`'s `"appVersionSource": "local"`
makes `app.json` the single source of truth for both — EAS reads them directly
instead of tracking its own counter:

- **`expo.version`** (`"1.0.0"`) — the human-readable version. Bump it for any
  release you'd want to recognize later; semver (patch/minor/major) is a reasonable
  default.
- **`expo.android.versionCode`** (`1`) — the integer Android uses to decide whether
  an APK is "newer." **Must strictly increase** for a new build to install over an
  existing one.

Two ways to bump `versionCode`:

1. **Manual** — edit `app.json` yourself before building. Simple and explicit.
2. **Automatic** — the `production` profile has `"autoIncrement": true`, so
   `eas build --profile production` bumps `android.versionCode` in `app.json` for
   you. EAS only writes the change to your local `app.json`; it does **not** commit
   it, so commit that bump yourself afterward to keep git in sync with what you
   actually shipped.

`development` and `preview` don't auto-increment — you'll build those far more often
than you care about strict version ordering.

## Configuration validation

Run before your first real build (and after any `app.json`/`eas.json` change):

```bash
npx expo-doctor
npx eas-cli config --platform android --profile production
```

`expo-doctor` needs no login and was run during setup — **21/21 checks passed**.
`eas config` needs `eas login` first (it resolves and prints the exact build config
EAS will actually use) and wasn't run in this environment since it requires an
authenticated Expo account — run it yourself once you're logged in, before kicking
off your first `production` build.
