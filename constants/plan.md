# Routines: Data Model Proposal

## Core idea

**Routines become what you practise. Progress is still stored per Sunnah.**

- A **Routine** is an ordered list of Sunnah IDs that share one moment of the day (after prayer, before sleep, and so on).
- The user practises one routine at a time, with the same 7-day streak as today.
- When a routine is finished, **every Sunnah in it** goes into `accomplishedIds`.
- Whether a routine is done is **calculated** ("all of its Sunnahs are accomplished"), never saved.

Why this matters: since saved progress refers only to Sunnah IDs, you can reorganise routines later (split, merge, reorder) **without breaking anyone's progress**.

---

## What exists today (and what's actually used)

| Thing                                                            | Used at runtime?              |
| ---------------------------------------------------------------- | ----------------------------- |
| `Sunnah.groupId`                                                 | ❌ Only in type and data      |
| `SUNNAH_GROUPS`                                                  | ❌ Never imported             |
| `Sunnah.notificationSchedule` / `notificationMessages` / `title` | ✅ `notifications.ts` only    |
| `currentSunnahId`, `skippedIds`                                  | ✅ Context, storage, rotation |
| `accomplishedIds` / `accomplishedRecords`                        | ✅ Achievements tab, stats    |

So the grouping layer already exists, but nothing uses it yet. The notification service only reads `title`, `notificationSchedule` and `notificationMessages`. If `Routine` has those same three fields, it can be passed to the service almost unchanged.

---

## New types

```ts
// types/index.ts

/** An ordered bundle of Sunnahs practised together at one moment of the day. */
export interface Routine {
  id: string; // PERMANENT, same rule as Sunnah IDs
  title: string; // "أذكار ما بعد الصلاة"
  icon?: string;
  intro?: string; // one line: when and why
  sunnahIds: string[]; // ordered steps
  streakDays?: number; // default 7
  notificationSchedule: NotificationSchedule;
  notificationMessages: string[];
  deprecated?: boolean;
}

export interface Sunnah {
  id: string;
  title: string;
  action: string;
  hadiths: HadithEvidence[];
  reward?: string;
  deprecated?: boolean;
  // REMOVED: groupId                      → membership now lives in Routine.sunnahIds
  // REMOVED: notificationSchedule/Messages → now on Routine
}
```

> [!NOTE]
> Membership is recorded **in one place only**: `Routine.sunnahIds`. Keeping both `groupId` and `sunnahIds` means two sources that can disagree.

`SunnahGroup` and `SUNNAH_GROUPS` are deleted. `Routine` replaces them.

**Single Sunnahs** (siwak, salam and the like, added later) are just routines with one step. That keeps one flow and one code path.

---

## Proposed grouping of the current catalog

The order of the `ROUTINES` array **is** the rotation order.

| #   | Routine id                | Steps (Sunnah IDs)                                              | Count |
| --- | ------------------------- | --------------------------------------------------------------- | ----- |
| 1   | `after_prayer_core`       | 1 istighfar, 3 la mani', 4 la hawla, 2 tasbih                   | 4     |
| 2   | `after_prayer_recitation` | 5 Ayat al-Kursi, 6 mu'awwidhat, 7 a'inni                        | 3     |
| 3   | `adhan`                   | 14 repeating the adhan, 15 du'a after it                        | 2     |
| 4   | `eating`                  | 16 tasmiya, 17 hamd                                             | 2     |
| 5   | `toilet`                  | 8 entering, 9 leaving                                           | 2     |
| 6   | `sleep_prep`              | 18 wudu, 10 dusting the bed, 11 right side, 24 hand under cheek | 4     |
| 7   | `sleep_recitation`        | 19 nafth, 12 Ayat al-Kursi, 20 end of al-Baqarah, 22 al-Kafirun | 4     |
| 8   | `sleep_dhikr`             | 13 tasbih, 23 iwaa', 25 bismika, 26 aslamtu (closing)           | 4     |
| 9   | `sajda_mulk`              | 21 as-Sajda and al-Mulk                                         | 1     |

- 25 Sunnahs become 9 routines, about 9 weeks instead of 25.
- After prayer: 7 weeks becomes 2 weeks.
- `sajda_mulk` stands alone because it takes ~15 minutes. Bundling it would make the sleep routine too heavy.

> [!IMPORTANT]
> The order of steps inside each routine is a religious question (the sequence the narrations describe), so please check it. I based #1 on the order in Muslim 591/592/594/597.

---

## Persisted state (v3)

```ts
export interface PersistedState {
  version: 3;
  currentRoutineId: string | null; // was currentSunnahId
  streakDates: string[]; // unchanged
  accomplishedIds: string[]; // unchanged — still Sunnah IDs
  accomplishedRecords: AccomplishedRecord[];
  skippedRoutineIds: string[]; // was skippedIds (Sunnah IDs)
  settings: UserSettings; // unchanged
  totalCompleted: number; // still counts Sunnahs
  longestStreak: number; // unchanged
}

export interface AccomplishedRecord {
  id: string; // Sunnah ID (unchanged)
  completedAt: string | null;
  method: "streak" | "already_doing" | null;
  routineId?: string; // NEW: which routine it was learned in
}
```

What changes:

- **Renamed:** `currentSunnahId` → `currentRoutineId`.
- **Changed meaning:** `skippedIds` → `skippedRoutineIds` ("postpone" applies to the whole routine).
- **Added:** `routineId` on records, so achievements can be grouped by routine.
- **Unchanged:** everything else.

---

## Behaviour

### Remaining steps

```ts
remainingSteps(routine) = routine.sunnahIds.filter(
  (id) => !sunnah(id).deprecated && !accomplishedIds.includes(id),
);
```

- The card shows only the remaining steps. Optionally, already-learned steps appear greyed out for context.
- A routine with no remaining steps is done and gets skipped in rotation.

### Actions

| Action                      | Effect                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Mark today done**         | One tap for the whole routine. Appends to `streakDates`. At `streakDays`, every remaining step is accomplished with method `streak`. |
| **Already doing (step)**    | NEW. Marks one Sunnah `already_doing` and removes it from the routine. Streak continues.                                             |
| **Already doing (routine)** | Marks all remaining steps `already_doing`, then moves to the next routine.                                                           |
| **Postpone**                | Adds to `skippedRoutineIds`, then moves to the next routine.                                                                         |

Per-step "already doing" is key. Someone who already does istighfar shouldn't have to keep checking it.

### Rotation

`nextSunnahId` becomes `nextRoutineId(currentId, accomplishedIds, skippedRoutineIds)`. The logic is the same, applied to `ROUTINES`, with "not done" meaning `remainingSteps.length > 0`.

### Notifications

`scheduleSunnahNotifications(sunnah, …)` becomes `scheduleRoutineNotifications(routine, …)`. It reads the same three fields. Copy like `«${title}»` and "day X of 7" uses `routine.title` and `streakDays`.

---

## Migration v2 → v3

The app **isn't in production yet**, so the only saved data is on your own devices and any testers'. Two options:

- **A (recommended): no migration.** Change `STORAGE_KEY` to `@sonan_state_v3` and start fresh. Zero code, zero risk.
- **B: migrate.** `currentSunnahId` maps to the routine containing it, `accomplishedIds` stay as they are, and skipped Sunnah IDs map to their routines. About 30 lines, and only worth it if testers' progress matters.

---

## Files affected

| File                                                                                    | Change                                                                       |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [types/index.ts](file:///a:/Projects/Sunnah/sonan/types/index.ts)                       | Add `Routine`, slim down `Sunnah`, v3 state                                  |
| [constants/data.ts](file:///a:/Projects/Sunnah/sonan/constants/data.ts)                 | Add `ROUTINES`, move notification fields, remove `groupId` / `SUNNAH_GROUPS` |
| [utils/sunnah.ts](file:///a:/Projects/Sunnah/sonan/utils/sunnah.ts)                     | `nextRoutineId`, `remainingSteps`                                            |
| [services/storage.ts](file:///a:/Projects/Sunnah/sonan/services/storage.ts)             | v3 key/shape, ID validation against routines                                 |
| [context/SunnahContext.tsx](file:///a:/Projects/Sunnah/sonan/context/SunnahContext.tsx) | `currentRoutine`, step-level already-doing, completion credits all steps     |
| [services/notifications.ts](file:///a:/Projects/Sunnah/sonan/services/notifications.ts) | Takes a routine                                                              |
| `screens/ActiveSunnah/*`                                                                | Card shows a list of steps (each with action, hadith, reward expandable)     |
| `screens/Accomplished/*`                                                                | Optionally group by `routineId`                                              |
| Onboarding steps / docs                                                                 | Copy and targets                                                             |

`utils/streak.ts` is **unchanged**.

---

## Open questions

1. **Daily marking:** one tap for the routine (recommended for v1), or checkboxes per step where all must be checked?
2. **Grouping:** is the table above right religiously, especially the sleep split and the order inside routine #1?
3. **Migration:** A (fresh key) or B (migrate)?
4. **`streakDays`:** 7 everywhere for v1, or longer for 4-step routines?
