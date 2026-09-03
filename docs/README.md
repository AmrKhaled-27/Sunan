# Sunan — Documentation

Sunan (سُنن) is an Arabic, right-to-left, fully offline Expo app for building prophetic habits **one Sunnah at a time**. The user practises a single Sunnah for seven consecutive days; once the streak completes, the app moves on to the next Sunnah automatically.

There is no backend, no account, and no network request anywhere in the app. All progress lives in `AsyncStorage` on the device, and prayer times are calculated on-device from cached coordinates.

## How these docs are organised

Every file below documents one feature and is split into two halves:

- **Part 1 — User Guide.** What the user sees and does, in plain language. No file paths, no code.
- **Part 2 — Technical Deep Dive.** Implementation: files, state, algorithms, edge cases, and the reasoning behind non-obvious choices.

| Document | Feature |
| --- | --- |
| [daily-sunnah.md](./daily-sunnah.md) | The home tab: today's Sunnah card, hadith, reward |
| [streak-tracking.md](./streak-tracking.md) | Marking a day done, the seven dots, milestones, broken streaks, celebration |
| [sunnah-rotation.md](./sunnah-rotation.md) | "Already doing", "Skip", which Sunnah comes next, and the catalog |
| [accomplishments.md](./accomplishments.md) | The achievements tab and its statistics |
| [notifications.md](./notifications.md) | The three kinds of local reminder and how they are scheduled |
| [prayer-times.md](./prayer-times.md) | Offline prayer time calculation and location handling |
| [settings.md](./settings.md) | The settings tab: toggles, reminder time, replay tour, reset |
| [onboarding-tour.md](./onboarding-tour.md) | The first-launch spotlight tour |
| [data-persistence.md](./data-persistence.md) | Storage schema, migration/validation, reset semantics |
| [design-system.md](./design-system.md) | Palette, typography, shared components, the "warm manuscript" look |
| [app-shell.md](./app-shell.md) | Bootstrap, RTL, routing, tab bar, error boundary, build and release config |

## Reading order for a new contributor

Start with [app-shell.md](./app-shell.md) to understand how the app boots and routes, then [data-persistence.md](./data-persistence.md) because almost every other feature reads or writes that one storage key. After that, [daily-sunnah.md](./daily-sunnah.md), [streak-tracking.md](./streak-tracking.md), and [sunnah-rotation.md](./sunnah-rotation.md) together describe the core loop.

## Conventions used across the codebase

- **Arabic strings are hardcoded.** There is no i18n library; the app is Arabic-only and forces RTL globally.
- **One context owns app state.** `context/SunnahContext.tsx` holds all progress and settings. `context/OnboardingContext.tsx` is deliberately separate because it holds only transient tour UI state.
- **Sunnah IDs are permanent.** Never change or reuse an ID in `constants/data.ts`; retire an entry with `deprecated: true` instead, or existing users' saved progress will point at the wrong Sunnah.
- **Styling is NativeWind.** `className` on React Native components, with the palette and font families exposed through `tailwind.config.js`. Raw `StyleSheet` is used only where animations or absolute overlays need plain values.

## Expo version

This project targets **Expo SDK 54** with the New Architecture enabled. Expo's APIs change between SDK versions; consult the versioned documentation at <https://docs.expo.dev/versions/v54.0.0/> before adding or upgrading anything.
