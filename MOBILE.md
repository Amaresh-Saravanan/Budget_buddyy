# 📱 BudgetBuddy on Android

The mobile app is the existing React frontend wrapped with [Capacitor](https://capacitorjs.com/).
There is no second codebase — the same `frontend/src` builds both the website and the app,
so any feature you add shows up in both.

## Just want to see it on your phone right now?

You don't need Android Studio for this. Run the app on your network and open it in
your phone's browser — it's the same code the native app runs, so everything except
the app icon behaves identically.

```bash
# terminal 1 — backend
cd backend && npm run dev

# terminal 2 — frontend, exposed to your network
cd frontend && npm run dev:mobile
```

`dev:mobile` prints a **Network:** URL like `http://192.168.1.5:5173`. Put that IP in
`frontend/.env.local` first so the app knows where the backend is:

```env
VITE_API_URL=http://192.168.1.5:5000/api    # same IP, port 5000
```

Restart `dev:mobile` after editing that file, then open the Network URL on your phone
(same Wi-Fi). That's the full app — income page, bank sync, everything.

Build the actual APK when you want it on your home screen and running without your
laptop on. Steps below.

## What you need

- **Android Studio** (includes the Android SDK) — https://developer.android.com/studio
- **JDK 17+** — bundled with recent Android Studio
- Your phone and computer on the **same Wi-Fi network**

## Step 1 — Point the app at a reachable backend

This is the step that trips everyone up. Inside the app, `localhost` means *the phone
itself*, not your computer, so the default `http://localhost:5000/api` can never work
on a device.

Find your computer's LAN IP:

```bash
# macOS / Linux
ipconfig getifaddr en0 || hostname -I | awk '{print $1}'
# Windows
ipconfig    # look for "IPv4 Address"
```

Then set it in `frontend/.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://192.168.1.5:5000/api   # ← your machine's IP, not localhost
```

The app logs a clear console error if you forget this, so check Chrome DevTools
(`chrome://inspect`) if requests are failing.

> **Note:** with a LAN IP, the app only works while your computer is on and the backend
> is running. To use it anywhere, deploy the backend (Render, Railway, Fly.io all work)
> and set `VITE_API_URL` to that HTTPS URL instead.

## Step 2 — Build and open the project

```bash
cd frontend
npm install
npm run cap:sync      # builds the web app and copies it into android/
npm run cap:open      # opens the project in Android Studio
```

Re-run `npm run cap:sync` after **every** change to the frontend — the Android project
holds a *copy* of the built web assets, so edits to `src/` don't appear until you sync.

## Step 3 — Install it on your phone

**Easiest — run directly from Android Studio:**
1. Enable *Developer Options* → *USB Debugging* on your phone
2. Plug it in, pick it from the device dropdown, hit ▶ Run

**Or build an APK you can sideload:**
```bash
cd frontend/android
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk
```
Copy that APK to your phone and open it to install (you'll need to allow
"install from unknown sources").

A debug APK is fine for personal use. It expires for Play Store purposes but installs
and runs indefinitely on your own device.

## Signing in on mobile

**Use email + password.** Google and Meta sign-in are hidden in the app on purpose:
Google rejects OAuth from embedded webviews with a `disallowed_useragent` error, so
those buttons would only lead to a Google error page. Email/password talks to Clerk's
API directly and works normally.

If you currently only have a Google-linked Clerk account, set a password on it from
the web app first (Settings → Security), then use that to sign in on mobile.

Making Google sign-in work in the app would mean opening the OAuth flow in a Chrome
Custom Tab and deep-linking back — doable, but a separate piece of work.

## Things worth knowing

- **Cleartext HTTP is enabled** (`android/app/src/main/res/xml/network_security_config.xml`)
  so the app can reach a LAN backend. If you move to an HTTPS backend, flip
  `cleartextTrafficPermitted` to `false`.
- **`android/` is committed** — it holds real configuration (the manifest, the network
  security config), not just generated output. Build outputs and keystores are ignored.
- **App identity** lives in `frontend/capacitor.config.json` (`appId`, `appName`).
  Changing `appId` after installing makes Android treat it as a different app.

## Ideas from here

- **Auto-capture UPI debits from SMS** — pairs well with the existing bank-email sync
  and works even when email alerts are delayed. Needs a Capacitor SMS-reader plugin and
  the `READ_SMS` permission (fine for a sideloaded personal app; Play Store restricts it).
- **Local notifications** for bill reminders via `@capacitor/local-notifications`.
- **App icon and splash screen** via `@capacitor/assets`.
