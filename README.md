# القبلة — Android app

The mobile version of `../qibla-app`: Qibla compass, prayer times, adhan notifications and a
home-screen widget. Built with Expo (SDK 57) and Expo Router; Arabic, right-to-left.

Unlike the web app, everything runs on the phone: prayer times are calculated offline with
[`adhan`](https://github.com/batoulapps/adhan-js), so the only network call is naming the
city for a GPS position (Nominatim).

## Run it

The app uses native modules (widget, custom notification sounds, background task), so it
needs a **development build**; Expo Go won't work.

```sh
npm install
npx eas-cli@latest login
npm run build:android:dev      # cloud build; install the APK it links to on your phone
npm start                      # then open the installed app, it connects to this server
```

With Android Studio installed you can build locally instead: `npm run android`.

For a standalone APK to share with testers: `npm run build:android:preview`.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run verify:times   # compares calculated times with the Aladhan API the web app uses
```

## Where things live

| Path | What |
| --- | --- |
| `src/app/` | Screens: Qibla (`index`), `prayer-times`, `settings` |
| `src/lib/qibla.ts`, `locations.ts`, `prayer.ts` | Copied from the web app |
| `src/lib/prayerCalc.ts` | Offline prayer times; maps the web app's Aladhan method IDs to `adhan` |
| `src/lib/notifications.ts` | Notification channels (one per adhan sound) and the 7-day schedule |
| `src/lib/backgroundRefresh.ts` | Tops up the schedule and redraws the widget twice a day |
| `src/widgets/` | Home-screen widget |
| `scripts/generate-icons.mjs` | Draws the app icons (`npm run icons`) |

Storage keys (`last-location`, `prayer-method`) match the web app's `localStorage` keys.

## Adhan recordings

Both are public domain (CC0) from Wikimedia Commons:

- `assets/sounds/adhan_full.ogg` — [Beautiful adhan.ogg](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg)
- `assets/sounds/adhan_short.ogg` — [Adhan.ogg](https://commons.wikimedia.org/wiki/File:Adhan.ogg)

To use a different recording, replace the file (keep the name) and rebuild. Android fixes a
notification channel's sound when it's created, so also bump the channel IDs in
`src/lib/notifications.ts` (e.g. `adhan-full-v1` → `adhan-full-v2`).
