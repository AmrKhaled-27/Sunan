# Plan 1 implementation handoff

Implemented 2026-10-24. The final Today-page design remains Plan 2 work.

## Authoritative content and preservation

Production Sunnah content lives in `constants/sunnahs.ts`. Before cleanup, it was compared directly against the unchanged original `constants/data.ts`: all 26 IDs, all 39 complete hadith objects, titles, actions, rewards and deprecation flags matched. Only `groupId`, `notificationSchedule` and `notificationMessages` were intentionally omitted, since routines own membership and reminders. The reference file was also checked against Git revision `2e016730e83c0046618435f7d2cd0be2c32a1974`.

After that verification passed, the user requested removal of the old catalog and temporary migration checks. `constants/data.ts`, the copy/evidence verifiers, their fixtures and package commands were removed. The old catalog remains recoverable from Git. Corruption probes had confirmed that altered or reassigned evidence, whitespace/diacritics, missing members and duplicate IDs failed verification before those checks were retired.

The `Sunnah` type now contains content fields only. Membership and reminder schedules live in `constants/routines.ts`; shared fallback reminder times live in `constants/reminders.ts`. Ongoing routine behavior tests remain in `tests/routines.test.cjs`.

## Implementation

- `constants/routines.ts`: nine routines, ordered members, explicit schedule unions, routine notification copy.
- `utils/routine.ts`: runtime structural validation, ordered/remaining member selectors and postponed rotation.
- `utils/routineState.ts`: fresh state, load recovery and pure transitions. Seven marked consecutive local dates or whole-routine already-doing credit only remaining members, with per-Sunnah records. Stale callbacks cannot apply twice to an advanced snapshot.
- `services/storage.ts`: only `@sonan_state_v3` is read/written. Writes are serialized. v2 progress and settings are ignored and left untouched. Failed normalization writes preserve successfully loaded progress instead of returning fresh state; rejected earlier writes do not block loading the last valid save.
- `context/SunnahContext.tsx`: one synchronously updated snapshot drives React state and persistence. Notifications consume that snapshot; reschedules/cancellation are serialized in the notification service. Foreground recovery and a local-midnight watcher refresh daily eligibility and reset expired streaks.
- `services/notifications.ts`: routine payload identity, existing prayer-time behavior and bedtime retained, daily suppression, startup/reset/disabled/all-complete cancellation, latest-request replacement.
- `screens/ActiveSunnah/index.tsx`: scrolling bridge with every remaining member's full action, per-member rewards and all evidence, routine controls, existing tour targets and completed-routine celebration identity.
- Confirmation dialogs, onboarding copy and achievements empty-state copy now describe routines. Achievements remain per Sunnah and retain completion order.

## Context contract for Plan 2

Continue using `useSunnah()` / `SunnahProvider`. There are no misleading single-Sunnah aliases.

- `currentRoutine: Routine | null`, `remainingMembers: Sunnah[]` in routine presentation order.
- `markDoneToday(): Routine | null` returns the just-completed routine only on successful seventh-day completion, allowing celebration to retain its identity after advancement.
- `markAlreadyDoing()` and `postponeRoutine()` act on the whole displayed routine.
- `streakDates`, `streakCount`, `hasMarkedToday`, `streakBrokenToday`, settings, prayer times and reset remain exposed.
- `accomplishedSunnahs`, `accomplishedRecords`, `totalCompleted` and `longestStreak` remain per-Sunnah/statistics data. Records include `routineId` provenance for new credits.
- `skippedRoutines` contains postponed routines.

## Verification

- `npm test`: 14 ongoing tests cover structure, expected reminder slots, rotation, streaks, credit, duplicate actions, local-midnight refresh scheduling/cleanup, storage recovery after write failure and notification concurrency. The one-time original-source/copy and frozen evidence checks passed before their removal during cleanup.
- `npx tsc --noEmit`: passes.
- `npm run lint`: no errors; one existing `react-hooks/exhaustive-deps` warning in `components/onboarding/SpotlightOverlay.tsx:134`.
- Notification tests use mocked native APIs. No device notification delivery or native UI smoke test was performed. Startup/reload, each routine action, achievements, reset, onboarding, all-complete and single-member UI behavior still need device smoke testing with SDK 54. The user explicitly requested no web-version testing; web checks were stopped.

Do not treat automated service checks as proof of OS delivery. Do not start Plan 2's final UI without a separate user request.
