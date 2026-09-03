<div align="center">

# سُنن · Sunan

**Build prophetic habits one Sunnah at a time.**

An Arabic, right-to-left, fully offline habit app. Practise a single Sunnah for seven consecutive days until it sticks — then the app moves you on to the next one.

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo&logoColor=white)](https://docs.expo.dev/versions/v54.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey)](#requirements)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-enabled-success)](https://docs.expo.dev/guides/new-architecture/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## The idea

Most habit apps hand you a checklist. Sunan hands you **one** thing.

The home screen shows a single Sunnah — its name, a plain-language explanation of exactly what to do, the hadith it comes from, and the reward reported for it. You practise it for seven consecutive days. On the seventh day it moves into your achievements and the next Sunnah takes its place. If you already practise it, you say so and skip ahead. If it does not fit your life right now, you postpone it and the app brings it back later.

Reminders are timed to the moment the act is actually relevant — a reminder about table manners arrives around meal times, a reminder about post-prayer remembrance arrives after a prayer — by calculating your real prayer times on the device.

## Highlights

- **One Sunnah at a time.** A ten-entry curated catalog, each with its narration, its reward, and the source reference for both.
- **Seven-day streaks.** Stored as calendar dates rather than a counter, so a missed day is detected honestly and the same day cannot be marked twice.
- **Context-aware reminders.** Three kinds — contextual nudges, an end-of-day check-in at a time you choose, and a streak-protection warning 30 minutes earlier. Marking the day done cancels the rest of today's.
- **Offline prayer times.** Computed on-device with [`adhan`](https://github.com/batoulapps/adhan-js) from a single cached coordinate pair, using the calculation method conventional for your region. No prayer-time API is ever called.
- **Genuinely offline and private.** No backend, no account, no analytics, no network request anywhere. Everything lives in `AsyncStorage` on the device.
- **A guided first run.** A seven-step spotlight tour that dims the screen, rings each element in gold, and scrolls off-screen targets into view — RTL-correct and calibrated by measurement rather than platform flags.
- **Built for Arabic.** Forced RTL, Amiri for quoted text and Tajawal for interface text, with line heights set explicitly everywhere so diacritics are never clipped.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81, React 19, New Architecture |
| Routing | Expo Router v6 (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind) with tokens from `constants/theme.js` |
| State | React Context — `SunnahContext` for progress, `OnboardingContext` for the tour |
| Persistence | `@react-native-async-storage/async-storage` |
| Prayer times | `adhan` + `expo-location` (one-shot, lowest accuracy) |
| Notifications | `expo-notifications`, local `DATE` triggers only |
| Animation | Reanimated 4 for the tour and confetti; legacy `Animated` for press feedback |
| Typography | `@expo-google-fonts/amiri`, `@expo-google-fonts/tajawal` |
| Delivery | EAS Build + EAS Update (OTA) |

## Requirements

- **Node.js 20.19.4 or newer** — the minimum for Expo SDK 54
- An iOS simulator, an Android emulator, or a physical device
- For local iOS builds: **Xcode 16.1 or newer**
- For store builds: an [Expo account](https://expo.dev) and the [EAS CLI](https://docs.expo.dev/build/setup/)

## Getting started

```bash
git clone https://github.com/AmrKhaled-27/Sunan.git
cd Sunan
npm install
npm start
```

Then press `i` for the iOS simulator or `a` for the Android emulator.

Expo Go is enough for most work, including reminders — Sunan schedules only **local** notifications, which remain supported in Expo Go, and they fire on simulators too. A native development build is worth making when you need to verify anything build-time, since these do not apply in Expo Go:

- the notification icon and accent colour from the `expo-notifications` config plugin
- the splash screen, adaptive icon, and Android edge-to-edge configuration
- release-accurate behaviour when launching from a notification tap (there is a [known Android debug-build issue](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/) where the splash screen misrenders on notification launch)

```bash
npm run ios      # expo run:ios
npm run android  # expo run:android
```

The `ios/` and `android/` folders are **not** committed — this project uses [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/), so those commands generate them from `app.json` on demand. Never edit generated native files; change the Expo config instead.

Lint with `npm run lint`.

> [!NOTE]
> Expo's APIs change meaningfully between SDK versions. Consult the **versioned** docs at <https://docs.expo.dev/versions/v54.0.0/> before adding or upgrading a dependency.

## Project structure

```
app/                     Expo Router routes (thin — screens live elsewhere)
  _layout.tsx            RTL, fonts, splash, providers, error boundary, notification taps
  (tabs)/                Bottom tab navigator: index, accomplished, settings
screens/                 Screen implementations, each with its own components/ folder
  ActiveSunnah/          Home: the card, streak dots, celebration, confirm modals
  Accomplished/          Achievements list and statistics
  Settings/              Toggles, time picker, reset
components/
  ui/                    Shared primitives: Button, Card, ConfirmModal, PaperBackground, HapticTab
  onboarding/            Spotlight overlay, step definitions, measurement probes
context/                 SunnahContext (all progress + settings), OnboardingContext (tour)
services/                storage, notifications, prayerTimes
constants/               data.ts (the Sunnah catalog), theme.js (design tokens)
utils/                   Pure helpers: date, streak, sunnah rotation, array
types/                   Domain types — the single source of truth for the data model
docs/                    Full documentation, one file per feature
```

Route files under `app/` are one-line re-exports of `screens/*`. The indirection exists so screens can keep their private components alongside them in a folder, which a file-based router cannot express.

## Documentation

Every feature has a document in [`docs/`](./docs), each split into a **user guide** half and a **technical deep dive** half that records the reasoning behind non-obvious decisions.

Start with [`docs/README.md`](./docs/README.md), or jump straight in:

| Document | Covers |
| --- | --- |
| [app-shell.md](./docs/app-shell.md) | Boot sequence, RTL, routing, tab bar, error boundary, build config |
| [data-persistence.md](./docs/data-persistence.md) | Storage schema, load-time validation, reset semantics |
| [daily-sunnah.md](./docs/daily-sunnah.md) | The home tab and the Sunnah card |
| [streak-tracking.md](./docs/streak-tracking.md) | Marking days, the seven dots, broken streaks, celebration |
| [sunnah-rotation.md](./docs/sunnah-rotation.md) | "Already doing", "Skip", and which Sunnah comes next |
| [accomplishments.md](./docs/accomplishments.md) | The achievements tab and its statistics |
| [notifications.md](./docs/notifications.md) | The three reminder types and how they are scheduled |
| [prayer-times.md](./docs/prayer-times.md) | Offline calculation, region methods, coordinate caching |
| [settings.md](./docs/settings.md) | Notification controls, time picker, reset |
| [onboarding-tour.md](./docs/onboarding-tour.md) | The spotlight tour and its coordinate calibration |
| [design-system.md](./docs/design-system.md) | Palette, typography, shared components |

New to the codebase? Read `app-shell.md` and `data-persistence.md` first — nearly every feature reads or writes that one storage key.

## Privacy

There is nothing to disclose, because there is nothing to collect. Sunan has no backend, no account, and makes no network requests. Progress and settings are stored only on the device, and prayer times are calculated locally from coordinates that are read once and cached — the app never needs your location again after that.

The consequence, stated plainly: **your progress is not backed up.** Uninstalling the app or clearing its storage loses it, and there is no export or restore.

## Contributing

Contributions are welcome. Two rules matter more than the rest.

### 1. Never change or reuse a Sunnah ID

IDs in `constants/data.ts` are permanent foreign keys. Every user's device stores their progress as ID strings, so reusing `"3"` for a different Sunnah would silently rewrite the history of every existing install, and deleting an entry would leave dangling references.

Retire an entry with `deprecated: true` instead — the rotation logic filters on it, while users who already completed it keep it in their achievements.

### 2. Religious content must be sourced

Every Sunnah carries a `hadith` and a `rewardSource`. Additions need an accurate narration with its collection and number, and a grading where relevant. If you are adding or correcting content, cite it in the pull request so it can be checked.

### Development notes

- **Add a Sunnah** by appending to `SUNNAHS` with the next unused ID, giving it reminder slots that suit the act and at least two `notificationMessages` (they are sampled randomly, so a single-entry pool makes every reminder identical).
- **Add a colour** to both `constants/theme.js` and `constants/theme.d.ts` — the types are hand-written and will drift otherwise.
- **Tab bar height is duplicated** in `app/(tabs)/_layout.tsx` and `context/OnboardingContext.tsx`, because the tour cannot attach a ref to the navigator's bar. Change both together.
- **Keep `SunnahContext` the single writer of persisted state.** The notification rescheduling effect depends on it.
- There is no test suite yet. The pure functions in `utils/` — `appendStreakDate`, `nextSunnahId`, `daysBetween`, `formatTime12h` — are written to be trivially testable and are the natural place to start.

Run `npm run lint` before opening a pull request.

## Releasing

Build profiles are defined in [`eas.json`](./eas.json):

| Profile | Distribution | Channel | Notes |
| --- | --- | --- | --- |
| `development` | internal | `development` | Dev client |
| `preview` | internal | `preview` | Android builds as an installable APK |
| `production` | store | `production` | Build numbers auto-incremented by EAS |

```bash
eas build --profile preview --platform android   # shareable APK
eas build --profile production --platform all    # store builds
eas update --channel production                  # ship a JS-only change over the air
```

`runtimeVersion.policy` is `appVersion`, so an OTA update only reaches builds whose `version` in `app.json` matches. Bumping `version` without shipping a new binary cuts existing installs off from further updates.

## License

Released under the [MIT License](./LICENSE) — free to use, modify, and distribute, including commercially, provided the copyright notice is retained.

The license covers the **code**. It does not extend to the hadith texts in `constants/data.ts`, which are quoted from their published collections and cited in place, nor does it grant rights to the decorative artwork in `assets/images/` beyond use within this project.

---

<div align="center">

Built with [Expo](https://expo.dev). Made for anyone trying to make a small good habit stick.

</div>
