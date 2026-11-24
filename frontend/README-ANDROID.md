# Krishna Gurukul Android app (Capacitor)

One React codebase serves the website and the Play Store app. Inside the app (`useNative()` from `src/native/platform.ts`) public website pages are skipped and it starts at splash > login > role home.

## Scripts (run in `frontend/`)

| Script | What it does |
|---|---|
| `npm run app:sync` | web build, then `cap sync android` |
| `npm run app:open` | opens `android/` in Android Studio |
| `npm run app:dev` | live reload on a phone or emulator (`cap run android --live-reload --external`) |
| `npm run app:build` | web build + sync + **signed release AAB** at `android/app/build/outputs/bundle/release/app-release.aab` |
| `npm run app:assets` | regenerates icon layers, themed (monochrome) icon, notification icon and splash from `public/logo.png` |
| `npm run store:assets` | regenerates `store-assets/icon-512.png` and `feature-graphic-1024x500.png` |

`versionName` = `package.json` `version`; `versionCode` = `major*10000 + minor*100 + patch` (or set `"androidVersionCode"` in package.json). Bump `version` before every upload.

## 1. Android Studio setup

1. Install Android Studio (Narwhal or newer) with **Android SDK Platform 36**, Build-Tools 36 and JDK 21 (bundled JBR is fine).
2. `npm install` at the repo root, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` (the deployed API origin, e.g. `https://api.krishnagurukul.in`).
3. `npm run app:sync`, then `npm run app:open`. Let Gradle sync finish and run on an emulator or phone.
4. Target is SDK 36, compile 36, min 24.

## 2. Firebase and `google-services.json` (push)

1. Firebase console > create project > add Android app with package `in.krishnagurukul.app`.
2. Download `google-services.json` into `frontend/android/app/` (git-ignored). Without it the app builds, push is simply off.
3. Project settings > Service accounts > generate a private key. Put `project_id`, `client_email` and `private_key` into the backend env as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep `\n` escapes). With those empty the API logs pushes to the console (mock mode).
4. Optional web config: `VITE_FIREBASE_*` in `frontend/.env`.

## 3. Create the upload key

```
keytool -genkeypair -v -storetype PKCS12 -keystore krishna-gurukul-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Keep the `.jks` and passwords **outside the repo** (password manager plus an offline backup). Copy `.env.app.example` to `.env.app` and fill `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` (or export them in the shell).

## 4. Build the AAB

```
cd frontend
npm run app:build
```

Needs JDK 21 and `ANDROID_HOME` set. If the keystore variables are missing the AAB is unsigned and the script warns.

## 5. App Links (emails open the app)

The manifest claims `https://krishnagurukul.in/parent|faculty|admin/...`. Android verifies through `https://krishnagurukul.in/.well-known/assetlinks.json`. The API serves it at `/.well-known/assetlinks.json`: set `ANDROID_CERT_SHA256` to the **Play App Signing** SHA-256 (Play Console > Test and release > App signing) and route that path on the website domain to the API. Note: Brevo click tracking rewrites links, so turn off link tracking for transactional mails or use a custom tracking domain.

## 6. Play Console steps

Use the launch checklist in the project brief. In order:

1. **Developer account.** A personal account needs a closed test with 12+ testers opted in for 14 consecutive days before production. An organization account (D-U-N-S) skips that.
2. **Create app**, enrol in **Play App Signing**, upload the AAB to **Internal testing** first (no review), then Closed testing, then Production with a staged rollout (20%, then 100%).
3. **Store listing:** copy from `store-assets/listing.md`. Upload `icon-512.png`, `feature-graphic-1024x500.png`, 4+ phone screenshots, 7 inch and 10 inch tablet screenshots. Category Education, contact email and website.
4. **Privacy policy URL:** `https://krishnagurukul.in/privacy-policy`.
5. **Data safety:** use the table in `listing.md` (child name, attendance, test results, parent email and phone, device token; encrypted in transit; deletion available).
6. **Account deletion:** in-app *Settings > Delete my account* plus public URL `https://krishnagurukul.in/delete-account`. Admins see and complete requests (`GET /api/admin/deletion-requests`, `POST .../:id/complete`).
7. **Content rating** (IARC questionnaire) and **Target audience:** children use the app, so read the Families policy before choosing age groups. If under 13 is selected, the Families rules apply (no ad SDKs, careful data collection). The app has no ad SDKs.
8. **App access:** give reviewers a demo parent and demo faculty login (seed with `npm run seed -- --demo`) and explain accounts are created by the institute.
9. **Target API:** new apps and updates must target API 36 from 31 Aug 2026 (already set).

### Screenshots

Create emulators: Pixel 8 (phone), Nexus 7 (7 inch) and Pixel Tablet (10 inch), log in with seeded demo data, then:

```
adb exec-out screencap -p > store-assets/phone-1-home.png
```

## Offline and sync

Practice modes and the abacus use the on-device engine. Practice results go through `submitPractice()` (`src/offline/queue.ts`): posted when online, otherwise queued in IndexedDB and flushed on reconnect or when the app returns to the foreground. List screens use `useCachedGet()` (`src/offline/cache.ts`) to show the last copy with a "last updated" time.

## Layout classes

`useBreakpoint()` and `AdaptiveShell`: small phone <375, phone <600, large phone/foldable <840 (bottom tabs); tablet <1200 (navigation rail); desktop 1200+ (sidebar).
