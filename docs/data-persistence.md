# Data Persistence

Everything the app remembers lives in three `AsyncStorage` keys on the device. There is no account, no sync, and no network.

---

# Part 1 — User Guide

## Where your data lives

On your phone, and nowhere else. Sunan has no server and no login. Your progress, your achievements, your reminder settings, and your saved location never leave the device.

The settings tab states this plainly: **«بياناتك محفوظة محلياً ولا نجمعها.»**

## What that means in practice

**Your data is private by construction.** There is nothing to leak, because there is nothing to send.

**Your data is not backed up.** If you delete the app, change phones, or clear the app's storage from your system settings, your progress is gone. There is no export and no restore.

**Your data is per-device.** Installing Sunan on a tablet gives you a separate, independent set of progress.

## What is remembered

- Which Sunnah you are currently working on
- Which days you have marked for the current streak
- Which Sunnahs you have completed, how you completed each one, and on what date
- Which Sunnahs you have skipped
- Your total completed count and your longest-ever streak
- Whether notifications are on, and your check-in time
- Whether you have seen the introductory tour
- Your last known coordinates, for prayer time calculation

## Missing a day, and the clock

The app decides what "today" is from your device's calendar, in local time. It does not consult a network clock. Changing your device's date will therefore affect how the app sees your streak.

## Clearing your data

**الإعدادات → إعادة ضبط التقدم** erases your progress and settings. It keeps your saved location and does not replay the tour. To remove absolutely everything, uninstall the app or clear its storage from your device settings. See [settings.md](./settings.md).

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `services/storage.ts` | The main state key: load, validate, save, clear |
| `types/index.ts` | `PersistedState`, `UserSettings`, `AccomplishedRecord` |
| `context/SunnahContext.tsx` | The only writer of the main key |
| `context/OnboardingContext.tsx` | Owns the onboarding flag key |
| `services/prayerTimes.ts` | Owns the coordinates key |

## The three keys

| Key | Owner | Value |
| --- | --- | --- |
| `@sonan_state_v2` | `services/storage.ts` | JSON-serialised `PersistedState` |
| `@sonan_onboarding_v1` | `context/OnboardingContext.tsx` | The literal string `"done"` |
| `@sonan_user_coords` | `services/prayerTimes.ts` | `{ latitude, longitude }` |

Each key has exactly one owning module and is never read or written from outside it. The `_v2` / `_v1` suffixes are an escape hatch: an incompatible schema change can be shipped by bumping the key name, which makes old data invisible rather than requiring a migration. That is a blunt strategy — it silently discards progress — so the `version` field inside the payload exists as the finer-grained alternative.

## Schema

`types/index.ts:73-83`

```ts
export interface PersistedState {
  version?: number;
  currentSunnahId: string | null;
  streakDates: string[]; // ISO date strings 'YYYY-MM-DD'
  accomplishedIds: string[];
  accomplishedRecords?: AccomplishedRecord[];
  skippedIds: string[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
}
```

`version` and `accomplishedRecords` are optional because both were added after the schema shipped and older payloads on real devices lack them. Everything else is required *in the type*, but the loader treats all of it as untrusted anyway.

The design is deliberately flat and JSON-primitive: strings, numbers, string arrays, and one array of small records. No `Date` objects (which do not survive `JSON.stringify` round-tripping as dates), no nested Maps, no derived values.

**Nothing derivable is stored.** `streakCount`, `hasMarkedToday`, `currentSunnah`, `accomplishedSunnahs`, and `skippedSunnahs` are all computed in the context from the stored primitives, so they cannot fall out of sync with their source. The two exceptions are `totalCompleted` and `longestStreak`, and both are deliberate — see [accomplishments.md](./accomplishments.md).

Sunnah references are stored as **ID strings**, never as embedded objects. This keeps payloads small and means editing a Sunnah's wording in `constants/data.ts` immediately updates every screen, including historical achievements. The cost is that IDs become permanent foreign keys, which is why `constants/data.ts` carries the never-reuse-an-ID rule.

## Loading

`loadPersistedState()` returns `LoadedStateResult` — the state plus a `streakBroken` flag — and is best understood as a validating deserialiser rather than a read.

### Fresh install

No stored value takes an early branch that returns `INITIAL_PERSISTED_STATE` with `currentSunnahId` derived by `nextSunnahId(null, [], [])` rather than hardcoded. A reset produces the same path, because `clearPersistedState` removes the key entirely.

### Validation, in order

**1. Streak continuity.** If the last marked date is two or more days from today, the streak is cleared and `broken` is set. Detailed in [streak-tracking.md](./streak-tracking.md).

**2. Record normalisation.** Every entry in `accomplishedIds` is guaranteed a matching `AccomplishedRecord`, with `null` fields for entries that predate the feature. Detailed in [accomplishments.md](./accomplishments.md).

**3. Current ID resolution.**

`services/storage.ts:84-91`

```ts
    // If saved ID is already accomplished, non-existent, or empty, find next valid ID
    if (
      !resolvedId ||
      accomplished.includes(resolvedId) ||
      !SUNNAHS.some((s) => s.id === resolvedId)
    ) {
      resolvedId = nextSunnahId(resolvedId, accomplished, skipped);
    }
```

Three distinct corruption cases in one condition: a missing ID, an ID that has somehow been completed while still current, and an ID no longer present in the catalog. The last is the important one — it is what makes editing `constants/data.ts` safe. A user whose current Sunnah was removed from a shipped build is silently moved to the next valid one instead of being stranded on a blank screen.

**4. Field defaults.** Every field is rebuilt with a fallback: `?? []` for arrays, `?? 0` for counters, and `{ ...DEFAULT_SETTINGS, ...(p.settings ?? {}) }` for settings. That spread is the settings migration mechanism — a newly added setting gets its default automatically on the next load, with no version check.

`version` is written as the literal `2` on every load, so a payload that omitted it is stamped going forward.

### Persisting a detected break

`services/storage.ts:105-107`

```ts
    if (broken) {
      await savePersistedState(loadedState);
    }
```

Only when something was corrected. The point is that the red banner appears exactly once: the cleared streak is durable, so the next launch sees a valid empty streak and reports no break.

### Failure

The whole body is wrapped in `try`/`catch`. A parse failure logs and returns the fresh-install state:

`services/storage.ts:113-123`

```ts
  } catch (error) {
    console.error("Failed to load persisted state", error);
    const initialId = nextSunnahId(null, [], []);
    return {
      state: {
        ...INITIAL_PERSISTED_STATE,
        currentSunnahId: initialId,
      },
      streakBroken: false,
    };
  }
```

Losing progress on corruption is a real cost, but the alternative — an unhandled throw during the boot sequence — would make the app permanently unopenable with no in-app way to recover. Note the corrupt value is **not** removed, so it will be re-read and re-fail on every launch until something writes over it. Any write from the running app fixes it.

## Writing

`savePersistedState` is a single `setItem` with a `try`/`catch` that logs and swallows:

`services/storage.ts:127-133`

```ts
export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save persisted state", error);
  }
}
```

There is no debouncing, no batching, and no queue. Every user action writes the whole object immediately. At this data volume — a few hundred bytes — that is the right trade: writes are rare (a tap or two per day) and always complete, so there is no window in which the app could be killed with an unflushed change.

Because the promise is never awaited by callers, a failed write leaves the in-memory state ahead of storage with no user-visible signal. Accepted, on the grounds that a write of this size failing implies a device in a state the app cannot meaningfully recover from.

### Single-writer discipline

`SunnahContext` is the **only** module that calls `savePersistedState`. Every action follows the same shape:

1. Compute the new values.
2. Call the relevant `setState`s.
3. Call `savePersistedState({ ...stateRef.current, ...changedFields })`.

The `stateRef` pattern — a ref reassigned during render to mirror all persisted state — is what makes step 3 a complete snapshot without each action needing to know about fields it did not touch. It is explained in [streak-tracking.md](./streak-tracking.md).

The write is not atomic with respect to the `setState` calls. If the process were killed between them, storage and memory would diverge — but since storage wins on the next launch, the worst outcome is losing the single action in flight.

## Clearing

`clearPersistedState()` calls `removeItem`, not `setItem` with an initial value. This is what unifies "fresh install" and "after reset" into one load path. `resetAllProgress` then resets in-memory state to match rather than forcing a reload.

Reset touches **only** `@sonan_state_v2`. The onboarding flag and cached coordinates survive, for the reasons given in [settings.md](./settings.md).

## Consequences for future work

- **Adding a field to `PersistedState`** requires: making it optional or giving it a `??` fallback in `loadPersistedState`, adding it to `INITIAL_PERSISTED_STATE`, adding it to the `stateRef` mirror in `SunnahContext`, and deciding whether `resetAllProgress` should clear it.
- **Adding a setting** needs only the type and `DEFAULT_SETTINGS`; the spread-merge handles existing installs.
- **Adding a new storage key** should follow the one-owning-module convention, and must be consciously classified as progress (cleared by reset) or not.
- **A breaking schema change** can bump the key suffix to `_v3`, but that discards user progress. Prefer a migration keyed on the `version` field, for which the current loader has the hook but no branch.
- **Backup or sync** would need a real migration story and, for sync, conflict resolution on `streakDates` — the arrays from two devices cannot simply be unioned without changing what a streak means.
