# Prayer Times

Prayer times are computed on the device, from a single cached coordinate pair, using a calculation method chosen from the user's region. No prayer-time API is ever called.

---

# Part 1 — User Guide

## Why the app needs prayer times

Several Sunnahs make sense at particular moments of the day — after a prayer, around a meal, before sleep. Rather than guessing at fixed clock times, Sunan works out your actual prayer times so reminders land when they are relevant, and stay relevant as the times shift through the year.

## What the app asks for

Once, on first launch, the app asks for permission to read your location. It requests the **lowest available accuracy** — city level is more than enough for prayer times — and it reads your position a single time. The coordinates are saved on your device and reused from then on.

## Privacy

Nothing leaves your phone. The settings tab states this directly: **«تُحسب أوقات الصلاة محلياً على جهازك دون اتصال. بياناتك محفوظة محلياً ولا نجمعها.»** There is no server to send anything to. Once your coordinates have been saved, the app never needs your location again — including with location services switched off.

## If you decline

Everything still works. The app falls back to a reasonable set of approximate times, and reminders arrive at sensible-but-generic hours instead. In settings, **أوقات الصلاة** will read **«أوقات صلاة تقريبية»** with a **تحديث** button. Tap it if you change your mind, and — provided you grant permission — the app will switch to times calculated for where you are.

When accurate times are in use, the row instead reads **«أوقات دقيقة حسب موقعك»** with a gold check mark.

## A note on calculation methods

Scholars differ on how the twilight angles for Fajr and Isha are determined, and different regions follow different conventions. Sunan picks the method commonly used where you are — the Egyptian General Authority's method in Egypt, Umm al-Qura in Saudi Arabia, and so on — so the times should match what you are used to locally.

The app does **not** display prayer times anywhere. They are used only to schedule reminders.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `services/prayerTimes.ts` | Everything: method selection, calculation, caching, fallback |
| `constants/data.ts` | `REMINDER_SLOT_TIMES`, the fallback table |
| `types/index.ts` | `PrayerTimesResult` |
| `context/SunnahContext.tsx` | `prayerTimes`, `refreshPrayerTimes` |
| `screens/Settings/index.tsx` | Status row and refresh button |
| `services/notifications.ts` | The only consumer |

Dependencies: [`adhan`](https://github.com/batoulapps/adhan-js) for the astronomical calculation, `expo-location` for a single one-shot position read.

## Why calculate rather than fetch

An HTTP prayer-times API would need network access at schedule time, would need a caching layer anyway, and would fail exactly when the user is travelling. `adhan` computes times from coordinates and a date with no I/O, which makes the app genuinely offline and lets `services/notifications.ts` compute a *different* set of times for each of the next seven days at no cost. That last property is the deciding factor — see the slot resolution section in [notifications.md](./notifications.md).

## Region-based method selection

`getCalculationParameters(latitude, longitude)` is a waterfall of bounding boxes returning an `adhan` `CalculationParameters`:

| Region | Bounding box | Method |
| --- | --- | --- |
| Egypt / North Africa | lat 22–32, lon 24–37 | `Egyptian()` |
| UAE | lat 22–26.5, lon 51–56.5 | `Dubai()` |
| Qatar | lat 24.5–26.5, lon 50.5–51.7 | `Qatar()` |
| Kuwait | lat 28.5–30.5, lon 46.5–48.5 | `Kuwait()` |
| Rest of Saudi / Gulf | lat 15–33, lon 34–60 | `UmmAlQura()` |
| North America | lat 24–72, lon −170 to −50 | `NorthAmerica()` |
| South Asia | lat 6–37, lon 60–98 | `Karachi()` |
| Turkey | lat 35–43, lon 25–45 | `Turkey()` |
| Southeast Asia | lat −11 to 8, lon 95–141 | `Singapore()` |
| Everywhere else | — | `MuslimWorldLeague()` |

Order is load-bearing in two places. Egypt is tested **before** the Gulf box, whose latitude range would otherwise swallow parts of it. The three small Gulf states are nested **inside** the Gulf branch and tested before its `UmmAlQura()` default.

The boxes are deliberately coarse and overlapping regions resolve to whichever branch is reached first. This is an approximation of a jurisdictional question, and it is the most likely thing in this file to need adjustment — a user near a box edge may get their neighbour's convention. There is no user-facing override.

## Calculation

`services/prayerTimes.ts:74-94`

```ts
export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): PrayerTimesResult {
  const coordinates = new Coordinates(latitude, longitude);
  const params = getCalculationParameters(latitude, longitude);
  const pt = new PrayerTimes(coordinates, date, params);

  return {
    source: "calc",
    fajr: { hour: pt.fajr.getHours(), minute: pt.fajr.getMinutes() },
    // ...
    fetchedAt: new Date().toISOString(),
    latitude,
    longitude,
  };
}
```

Two things to note. The function is **pure and synchronous**, which is what allows the notification scheduler to call it seven times in a tight loop. And the returned shape flattens `adhan`'s `Date` objects into `{ hour, minute }` pairs in **device-local time** via `getHours`/`getMinutes` — the scheduler wants clock components, not instants, because it builds a target `Date` by calling `setHours` on the appropriate day.

`adhan` spells the fifth prayer `isha`; this codebase spells it `ishaa` throughout. The mapping happens here and nowhere else.

`latitude` and `longitude` are echoed back on the result. This is the mechanism by which the notification scheduler can recalculate per-day times: it receives a `PrayerTimesResult` and, if the coordinates are present, uses them to recompute rather than reusing the single day's times.

## Retrieval and caching

`getPrayerTimes(forceRefresh = false)` is the async entry point:

1. **Unless forced**, read `@sonan_user_coords` from `AsyncStorage`. If it holds two numbers, calculate and return immediately — no permission check, no location read.
2. Otherwise request foreground location permission. Denied → `getFallbackTimes()`.
3. Granted → `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest })`, cache the coordinates, calculate, return.

The cache-first ordering is the important part: after the first successful read the app never touches `expo-location` again, so there is no permission dialog, no GPS warm-up, and no failure mode on subsequent launches. `Accuracy.Lowest` is a privacy and battery choice — it typically resolves from the network rather than GPS, and prayer times are insensitive to anything finer.

The `typeof latitude === "number"` guard on the parsed cache is not paranoia; `JSON.parse` of a partially written or hand-edited value could yield anything, and passing `undefined` into `adhan` produces `NaN` times that would schedule notifications at invalid dates.

### Error path

The `catch` block tries the cache **again** before giving up:

`services/prayerTimes.ts:140-151`

```ts
    try {
      const cached = await AsyncStorage.getItem(COORDS_STORAGE_KEY);
      if (cached) {
        const { latitude, longitude } = JSON.parse(cached);
        if (typeof latitude === "number" && typeof longitude === "number") {
          const result = calculatePrayerTimes(latitude, longitude, new Date());
          return { ...result, source: "cache" };
        }
      }
    } catch {
      // Ignore cache read errors
    }
```

This is the `forceRefresh` recovery path. A user tapping **تحديث** skips the cache; if the fresh location read then fails (airplane mode, revoked permission, a hardware timeout), falling straight through to generic fallback times would be a regression from what they already had. Re-reading the cache here preserves their previously accurate times.

Note the `source` is overridden to `"cache"` — this is the only place that value is produced, and it exists purely so this degraded-but-accurate path is distinguishable in the settings UI from a clean calculation.

## The `source` field

`types/index.ts:45-46`

```ts
export interface PrayerTimesResult {
  source: "calc" | "api" | "cache" | "fallback";
```

| Value | Meaning |
| --- | --- |
| `calc` | Fresh calculation from coordinates, whether from cache or a live read |
| `cache` | Calculation from cached coordinates after a failed refresh |
| `api` | **Unused.** Vestigial from an earlier network-backed implementation |
| `fallback` | Static `REMINDER_SLOT_TIMES`; no coordinates available |

The settings UI treats `calc`, `api`, and `cache` as equivalent — all three mean "accurate" — and only `fallback` (or a `null` result) offers the refresh button. `api` is dead but harmless; removing it would be a safe cleanup.

`fetchedAt` is an ISO timestamp on a calculated result and `null` on fallback. Nothing reads it; it is available for diagnostics.

## Fallback

`getFallbackTimes()` returns the five prayer entries from `REMINDER_SLOT_TIMES` with `source: "fallback"` and no coordinates. Because coordinates are absent, the notification scheduler's per-day recalculation branch is skipped and every day in the window uses the same static times.

## Wiring into the context

Fetched once at startup, after state load:

`context/SunnahContext.tsx:77-83`

```tsx
  useEffect(() => {
    (async () => {
      await setupAndroidChannels();
      await initLoadState();
      await fetchPrayerTimes();
    })();
  }, []);
```

Sequential and awaited, not parallel: channels must exist before anything schedules, and prayer times arriving before persisted state would trigger the scheduling effect against an empty Sunnah.

`fetchPrayerTimes` swallows its own errors with a `console.warn` and leaves `prayerTimes` as `null` — the scheduler already handles `null` by using the static table, so a failure here degrades rather than breaks.

Because `prayerTimes` starts `null` and is filled asynchronously, the scheduling effect typically runs **twice** on launch: once with fallback timing, then again with real times once the location resolves. The identifier scheme in `services/notifications.ts` makes the second pass overwrite the first rather than duplicate it. See [notifications.md](./notifications.md).

`refreshPrayerTimes` is `fetchPrayerTimes(true)` exposed on the context, and because it sets `prayerTimes`, it transitively reschedules everything through that same effect dependency.

## Limitations

- **The cache never expires.** A user who moves to a different city keeps their old coordinates until they hit **تحديث** — and that button is only offered when the current source is `fallback`, so a relocated user with a valid cache has no way to update it from the UI. This is the most significant gap in the feature.
- **High latitudes.** `adhan` supports high-latitude rules, but none is configured, so Fajr and Isha may be unreliable above roughly 48° in summer.
- **No madhab configuration for Asr.** The `adhan` `Madhab` setting is left at each method's default, so the Hanafi Asr time is not available.
- **No manual coordinate entry** and no method override.
