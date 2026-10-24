# Plan 1: Routine data, hadith preservation, and application behavior

Status: agreed implementation plan, created 2026-10-24. This document authorizes planning only; implement it in a later session when requested.

Implement this plan before [Plan 2: Today page](plan-2-today-page.md). The earlier [proposal](plan.md) is background; this document and Plan 2 supersede its conflicting recommendations.

## Outcome and scope

Replace the active single-Sunnah learning unit with a routine containing an ordered list of Sunnah IDs. Keep accomplishments per Sunnah. Prove that every existing hadith evidence object remains exactly unchanged under the same Sunnah ID.

This plan includes catalog structure, types, storage, context, rotation, notifications, meaningful verification, and enough consumer updates to leave the application runnable. Plan 2 owns the finished Today-page layout, sources modal, rewards panel, and action placement.

Before writing application or verification code, read the repository instructions and the exact Expo SDK 54 documentation at https://docs.expo.dev/versions/v54.0.0/. Confirm that documentation actually targets SDK 54; do not silently use a redirect to the latest SDK. No SDK upgrade is part of either plan.

## Decisions already settled

- Preserve the complete `hadiths` arrays exactly. Other Sunnah text and routine metadata may change intentionally.
- Preserve existing Sunnah IDs and their association with their evidence. Never reuse IDs, delete existing entries, or move evidence between Sunnahs.
- Routine order and member order are presentation/learning order, not a claim of a religiously prescribed sequence.
- Use the proposed nine routines, covering all 26 current Sunnahs. The original proposal incorrectly said 25. The current catalog has 39 hadith evidence entries.
- One self-reported daily tap counts one day for the entire routine. Do not check individual actions, practice times, frequency, or prayer occurrences.
- Seven consecutive marked dates complete a routine. Retain the existing missed-day reset rule.
- “Already doing” applies to the entire routine; there is no per-Sunnah action.
- Advance immediately on completion or “already doing.” The next routine can receive its first marked day on the same calendar date.
- Preserve postponement behavior exactly, including clearing the streak and cycling through postponed routines when necessary.
- Start fresh using a new v3 storage key. No migration of old progress or settings is needed.
- Combine member notification schedules using a union of reminder slots, without duplicate slots. Routine messages and titles may be newly written.

## 1. Freeze the evidence before changing the catalog

Create the baseline as the first implementation milestone, while `constants/data.ts` still contains the original catalog. Do not first edit the catalog and then create the expected data from the edited version.

Suggested artifacts:

- `tests/fixtures/hadiths-before-routines.json`: frozen mapping/list of each original Sunnah ID and its complete ordered `hadiths` array.
- `tests/fixtures/hadiths-before-routines.provenance.json`: original source path, Git revision/blob identity where available, source-file SHA-256, baseline-file SHA-256, extraction procedure, and observed counts.
- A documented verification command, exposed through a package script, that compares the live catalog against the frozen fixture and exits nonzero on a mismatch.

Recheck counts at implementation time. If the catalog has changed since this planning session, identify the change and capture the actual pre-refactor catalog rather than forcing the historical 26/39 counts onto it. Once captured, lock that baseline for this refactor.

Extract actual TypeScript data using a reliable parser/module-loading approach supported by the repository; do not parse Arabic strings with regex or hand-copy the evidence. Record how the extraction was checked against the original source. Keep the baseline outside production imports.

The normal verification command must only read the fixture. It must never regenerate expected data, overwrite it, or offer an automatic snapshot update that could bless a regression. Retain the fixture after rollout as the regression reference for this catalog migration.

### Exact preservation contract

For every original Sunnah ID:

1. The same ID still exists exactly once.
2. Its entire `hadiths` array is deeply equal to the baseline.
3. Array length and evidence order are unchanged.
4. Every object field and value is unchanged, including `text`, `source`, `grading`, optional evidence `id`, and any additional fields present in the baseline.
5. Missing versus present fields remain distinguishable. No added, removed, merged, deduplicated, or reassigned evidence is accepted.

Compare object fields without depending on object-key order, but preserve array order. Compare strings exactly: do not trim, collapse whitespace, normalize Unicode, remove diacritics, replace punctuation, or convert Arabic digits. TypeScript/JSON formatting or equivalent escape notation may differ; the resulting string values must not.

Match Sunnahs by ID, not catalog-array position. Changing catalog presentation order is allowed. Preserve the complete original ID set during this refactor; adding new Sunnahs is separate work.

Return actionable diagnostics such as Sunnah ID, evidence index, field path, and first differing character/code point. Check per-ID counts as well as totals: a total of 39 alone cannot establish preservation. Hashes support provenance; deep comparison is the acceptance check.

### Prove the verifier catches corruption

Use in-memory copies or temporary fixtures to confirm failures for a changed Arabic character/diacritic, whitespace change, changed source or grading, optional evidence-ID change, removed or reordered evidence, evidence moved between Sunnahs, and a missing/duplicate Sunnah ID. Confirm that catalog reordering and object-key reordering pass. Never mutate the committed baseline for these checks.

## 2. Introduce the catalog structure alongside the old data

Recommended organization:

- `constants/sunnahs.ts`: Sunnah content with the protected evidence copied mechanically.
- `constants/routines.ts`: routine definitions, ordering, notification schedules, and routine notification copy.
- `constants/data.ts`: compatibility exports for existing import paths and shared constants such as `REMINDER_SLOT_TIMES`.

Create the new files alongside the existing data first, run preservation and structural validation against the candidate catalog, then switch consumers. Avoid a permanent duplicate catalog. Remove the old inlined catalog only after the checks pass; retain the frozen evidence fixture.

### Types

- `Sunnah`: retain `id`, `title`, `action`, `hadiths`, optional `reward`, and optional `deprecated`. Remove `groupId` and notification ownership.
- `HadithEvidence`: preserve its data contract. Do not remodel evidence as part of this migration.
- `Routine`: permanent `id`, `title`, optional `icon`/`intro`, ordered `sunnahIds`, `notificationSchedule`, `notificationMessages`, optional `deprecated`, and optionally `streakDays` defaulting to 7. All initial routines use 7; variable durations are out of scope.
- Delete `SunnahGroup` and `SUNNAH_GROUPS`; there are no current runtime consumers.
- Membership has one source: `Routine.sunnahIds`.

Use routine-specific titles and messages appropriate to the whole routine. Existing non-hadith content may change, but avoid unrelated editorial rewrites. Rewards stay associated with their Sunnah; do not invent a combined religious reward for a routine.

### Agreed routines

The routine array establishes learning rotation. Each member list establishes presentation order only.

| Routine ID | Members in order | Suggested title |
| --- | --- | --- |
| `after_prayer_core` | `1`, `3`, `4`, `2` | أذكار ما بعد الصلاة |
| `after_prayer_recitation` | `5`, `6`, `7` | القراءة والدعاء بعد الصلاة |
| `adhan` | `14`, `15` | سنن الأذان |
| `eating` | `16`, `17` | سنن الطعام |
| `toilet` | `8`, `9` | آداب الخلاء |
| `sleep_prep` | `18`, `10`, `11`, `24` | الاستعداد للنوم |
| `sleep_recitation` | `19`, `12`, `20`, `22` | القراءة قبل النوم |
| `sleep_dhikr` | `13`, `23`, `25`, `26` | أذكار النوم |
| `sajda_mulk` | `21` | قراءة السجدة والملك |

Titles are implementation copy suggestions, not protected evidence. Single-Sunnah routines use the same model and behavior as larger routines.

### Structural validation

Reject duplicate Sunnah IDs, duplicate routine IDs, unknown member IDs, empty member lists, duplicate members within a routine, and invalid reminder slots. For this initial catalog, assert that every active Sunnah belongs to exactly one active routine, giving nine routines and 26 unique covered members. Do not build support for overlapping membership in this implementation.

Ignore deprecated Sunnahs when deriving active/remaining members. A routine with no remaining active members is complete for rotation purposes; completion is derived, not persisted as a second set of routine accomplishments. Missing references are validation errors, not silently completed members.

## 3. Implement routine selection and state transitions

Provide pure selectors for looking up a routine's ordered members, obtaining remaining unaccomplished members, and selecting the next routine. Validate references before using these selectors.

Update `utils/sunnah.ts` or introduce a clearly named routine utility, and switch its consumers. Preserve the existing selection policy: first prioritize unfinished, non-postponed routines in array order; when none remain, cycle through unfinished postponed routines; return `null` only when no unfinished active routines exist.

| Event | Required result |
| --- | --- |
| Mark today, below day 7 | Append today's local date once; update longest streak; leave active routine unchanged. |
| Mark today, day 7 | Accomplish every remaining member, add per-Sunnah records with today's date and method `streak`, advance, and clear active streak dates. |
| Already doing | Accomplish every remaining member with method `already_doing`, advance, and clear active streak dates. |
| Postpone | Add the routine ID to postponed IDs once, select the next routine using the existing policy, and clear active streak dates. |
| Missed day | Preserve existing continuity behavior: a gap of two or more calendar dates resets the active streak. |
| Everything accomplished | Active routine is `null`; show the all-complete state and cancel practice notifications. |

Preserve the edge case where postponing the only remaining routine selects that same routine and clears its streak. Do not silently disable or change this behavior; its confirmation copy must explain the reset.

Use existing local-date helpers. `utils/streak.ts` should remain unchanged unless a demonstrated compatibility issue requires a narrowly scoped correction. Avoid assertions about what counts as religious performance: the user owns the daily attestation.

Prevent rapid repeated actions from adding duplicate dates, records, achievements, or repeated transitions. Updating state, persistence, and notification scheduling must use the same resulting snapshot. `totalCompleted` counts unique accomplished Sunnahs, including those credited through “already doing”; completing four new members increases it by four, not one. Never credit already-accomplished members twice.

Capture the completed routine's identity before advancing, so celebration cannot show the next routine's title. The next routine starts with an empty streak and may be marked today independently.

## 4. Fresh v3 persistence and context contract

Use `@sonan_state_v3`. Ignore v2 state; no mapping or migration is required. Fresh v3 state includes default settings, empty progress, and the first eligible routine.

Persist version 3, `currentRoutineId`, `streakDates`, per-Sunnah `accomplishedIds` and `accomplishedRecords`, `skippedRoutineIds`, settings, `totalCompleted`, and `longestStreak`. Records may include `routineId` as historical completion provenance; achievements remain per Sunnah and do not need routine grouping.

Expose `currentRoutine`, its ordered remaining members, routine-level daily/already-doing/postpone actions, existing streak/settings/statistics state, and per-Sunnah achievements through context. Update every consumer rather than leaving misleading single-Sunnah aliases that conceal a multi-member routine.

Validate stored IDs against the correct catalog: routine IDs for current/postponed state, Sunnah IDs for accomplishments. On load, recover an invalid, deprecated, or already-complete active selection using routine rotation, and retain existing streak-continuity validation. If recovery changes the active routine, clear its old streak so it cannot credit a different routine.

Reset-all must clear v3 progress and return to the first routine. Leave the old v2 key unread; deleting it is unnecessary. A reset/new key does not remove OS-scheduled notifications, which need separate cancellation.

## 5. Routine notifications

Rename/adapt `scheduleSunnahNotifications` to consume a routine. The service uses identity as well as title, schedule, and messages: replace notification payload `sunnahId` with `routineId` and audit notification response handlers. No new notification deep-link behavior is required.

Build each routine's initial schedule from the union of its original members' reminder slots, with stable ordering and no duplicates. Combine `endOfDayCheckIn` using logical OR. Capture the original schedules before removing them from Sunnah data; then store the resulting routine schedules explicitly. Do not retain duplicate schedule ownership on Sunnahs merely to compute the union at runtime.

The current members agree within every proposed routine, so the expected schedules are:

| Routines | Reminder slots |
| --- | --- |
| Both after-prayer routines and `adhan` | `fajr`, `dhuhr`, `asr`, `maghrib`, `ishaa` |
| `eating` | `morning`, `afternoon`, `maghrib` |
| `toilet` | `fajr`, `morning`, `dhuhr`, `asr`, `maghrib`, `ishaa`, `before_sleep` |
| All four sleep routines | `ishaa`, `before_sleep` |

All initially enable the end-of-day check-in. A reminder slot produces one routine notification, not one notification per member. Messages must describe the routine rather than imply that one member is the whole practice. Streak copy must use the routine target/default of seven.

Preserve prayer-time calculation, fallback times, permissions, settings, and daily suppression behavior. Do not introduce an after-prayer delay or change `before_sleep` to follow the end-of-day setting as an incidental change. Cancel old scheduled notifications before scheduling v3 notifications, including startup, routine switches, reset, disabled notifications, and all-complete state. Ensure overlapping asynchronous reschedules cannot leave a stale routine's reminders active.

## 6. Keep the app usable before Plan 2

Update `types/index.ts`, context, service consumers, and affected screens together so type checking and runtime are coherent. Plan 1 must not show only one member while its completion button credits an entire routine.

Use a minimal scrolling bridge view in `screens/ActiveSunnah/index.tsx` that displays the active routine title and every remaining member's title/full action in order, with existing routine-level controls. Retain access to evidence using a simple implementation if necessary; the finished sources modal and rewards layout belong to Plan 2. Avoid spending this phase on the final visual design.

Update `AlreadyDoingModal`, `SkipModal`, and `StreakCompleteModal` to describe whole routines. Keep achievements and their statistics per Sunnah. Update onboarding copy that promises one Sunnah at a time, and keep its existing targets working in the bridge layout. Plan 2 will adapt targets for the final layout and secondary menu.

## 7. Verification and implementation handoff

Run the preservation verifier before switching consumers and again after all changes. Add focused automated checks for structural validation, rotation including postponed-only cases, day-seven multi-member crediting, whole-routine already-doing, duplicate-action protection, same-day next-routine credit, missed-day reset, fresh v3 loading, and schedule union/deduplication.

Run `npx tsc --noEmit` and `npm run lint`. Smoke-test startup with an existing v2 save, fresh v3 reload, each routine action, achievements, reset, notification rescheduling, all-complete state, and a single-member routine. Use an SDK-54-compatible device/development build for notification checks where required; report what was actually tested.

Plan 1 is complete when:

- The frozen evidence comparison passes for every original ID and evidence object, with corruption probes demonstrating meaningful failures.
- All nine routines cover the existing catalog exactly once and have the expected schedules.
- Fresh v3 state, routine transitions, per-Sunnah accomplishments, and notifications work together without duplicate credit or old reminders.
- The bridge UI exposes all actions being credited and the application passes type/lint checks.
- The handoff identifies actual files, verification commands/results, context contract, and any limitations for the Plan 2 session.

Do not begin Plan 2's full UI implementation automatically. Report Plan 1's result so the user can initiate that separate session.
