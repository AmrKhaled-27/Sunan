# Accomplishments (الانجازات)

The second tab: a record of every Sunnah the user has established, with two summary statistics.

---

# Part 1 — User Guide

## What this tab shows

**الانجازات** is your history. Every Sunnah you have completed appears here, newest first, so the most recent achievement is always at the top.

## The two statistics

Above the list sit two cards:

- **سنن مكتملة** — how many Sunnahs you have completed in total.
- **أطول سلسلة** — your longest unbroken run of days, ever. Breaking a streak never lowers this number.

These only appear once you have completed something.

## Each achievement card

A card carries:

- A **badge** at the top telling you *how* you completed it — **«سبعة أيام متتالية»** if you built it up over seven days, or **«كنت أفعلها»** if you declared you already practised it.
- The **Sunnah's title**.
- The **first two lines** of its practical description, as a reminder of what it involves.
- The **date** you completed it, written out in Arabic, for example «١٥ سبتمبر ٢٠٢٦».

Older achievements, saved before the app started recording this information, show **«مكتملة»** and no date. Nothing is lost — the app simply did not know those details at the time.

## Before you have finished anything

An empty state appears instead of the list, in a decorated card with a crescent icon: **«لم تنجز أي سنن بعد»** and beneath it **«أتمّ سنة لسبعة أيام متتالية، وستظهر هنا كعادة ثبتّها.»**

## Things this tab does not do

The list is read-only. There is no tapping into a detail view, no search, no filter, and no way to remove a single achievement. The only way to clear this tab is **إعادة ضبط التقدم** in settings, which wipes everything. Skipped Sunnahs do not appear here — a skip is a postponement, not a completion.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `app/(tabs)/accomplished.tsx` | Route file |
| `screens/Accomplished/index.tsx` | Screen: stats, list, empty state |
| `screens/Accomplished/components/StatsRow.tsx` | The two stat cards |
| `screens/Accomplished/components/AccomplishedCard.tsx` | List item |
| `context/SunnahContext.tsx` | Source of all four values consumed |
| `utils/date.ts` | `formatArabicDate` |

## The two-collection model

The screen reads four values: `accomplishedSunnahs`, `accomplishedRecords`, `totalCompleted`, and `longestStreak`.

The split between the first two is the central design point. `accomplishedIds` (and its hydrated form `accomplishedSunnahs`) answers *which* Sunnahs are done. `accomplishedRecords` answers *how and when* each was done:

`types/index.ts:67-71`

```ts
export interface AccomplishedRecord {
  id: string;
  completedAt: string | null; // ISO date 'YYYY-MM-DD'; null for older saves
  method: AccomplishedMethod | null;
}
```

The two are kept as parallel collections rather than merged into one list of records because `accomplishedIds` predates the records feature and is the field every other code path (rotation, `currentSunnah` resolution) reads. Retrofitting records as a separate array meant older saves could be upgraded without touching the field the app's core logic depends on.

## Joining them

The screen builds a lookup map and reverses the ID list, both memoised:

`screens/Accomplished/index.tsx:16-26`

```tsx
  const recordsById = useMemo(() => {
    const map = new Map(
      accomplishedRecords.map((record) => [record.id, record]),
    );
    return map;
  }, [accomplishedRecords]);

  const newestFirst = useMemo(
    () => [...accomplishedSunnahs].reverse(),
    [accomplishedSunnahs],
  );
```

`accomplishedIds` is append-ordered, so `reverse()` on a copy yields newest-first. The copy matters — `Array.reverse` mutates, and the array comes from the context's derived value.

`recordsById.get(item.id)` is passed as an optional prop, so a Sunnah with no matching record renders with fallbacks rather than crashing. That is not a theoretical case; see normalisation below.

## Record normalisation on load

The two collections could drift — an install that predates records has IDs but no records at all. `services/storage.ts` reconciles them at load time:

`services/storage.ts:32-44`

```ts
function normalizeAccomplishedRecords(
  ids: string[],
  records?: AccomplishedRecord[],
): AccomplishedRecord[] {
  if (records && records.length > 0) {
    const have = new Set(records.map((record) => record.id));
    const missing = ids
      .filter((id) => !have.has(id))
      .map((id) => ({ id, completedAt: null, method: null }));
    return [...records, ...missing];
  }
  return ids.map((id) => ({ id, completedAt: null, method: null }));
}
```

Every ID is guaranteed a record; the ones the app cannot know about get `null` for both fields. This is why `completedAt` and `method` are nullable in the type rather than required — the nullability is a migration artefact that the UI must handle, not an optional feature.

Note the asymmetry: records are reconciled *up* from IDs, but an orphan record with no matching ID is left alone and simply never rendered, since the list iterates over IDs.

## Rendering a card

`AccomplishedCard` resolves both nullable fields to display values:

`screens/Accomplished/components/AccomplishedCard.tsx:20-23`

```tsx
  const methodLabel = record?.method ? METHOD_LABELS[record.method] : "مكتملة";
  const dateLabel = record?.completedAt
    ? formatArabicDate(record.completedAt)
    : null;
```

A missing method degrades to the neutral «مكتملة»; a missing date omits the date line entirely rather than showing a placeholder.

`formatArabicDate` parses the ISO string into components and constructs a **local** `Date` before formatting, avoiding the UTC-parsing pitfall where `new Date("2026-09-15")` is midnight UTC and can render as the previous day in negative offsets:

`utils/date.ts:45-52`

```ts
export function formatArabicDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
```

`Intl.DateTimeFormat("ar")` is the only internationalisation API in the app; everything else is hardcoded Arabic. It relies on Hermes shipping full ICU, which is the case on the SDK 54 New Architecture builds this project targets. If ICU were ever stripped, this would silently fall back to a Latin-numeral format rather than throw.

The `action` text is clamped with `numberOfLines={2}`, and both title and action carry an explicit `writingDirection: "rtl"` style. That explicit direction is belt-and-braces on top of the global `forceRTL` — the strings can begin with a Latin character or a digit, which would otherwise let the platform's first-strong-character heuristic flip the paragraph direction.

## Stats

`StatsRow` renders two instances of a local `StatCard` and is a pure presentational component taking `totalCompleted` and `longestStreak` as numbers.

Both values come straight from persisted state, not from the arrays. `totalCompleted` is incremented independently in `markDoneToday` and `markAlreadyDoing`, and `longestStreak` is `Math.max`-ed on every mark. Keeping them as stored counters rather than deriving `totalCompleted` from `accomplishedIds.length` means the two could theoretically disagree after a partial write — but it also means the counters survive as a historical record even if the ID list is ever pruned. `longestStreak` genuinely cannot be derived, since it may reflect a run that was broken and left no trace in `streakDates`.

The row is only mounted when `accomplishedSunnahs.length > 0`, so a fresh install shows the empty state alone rather than two zeroes.

## List versus empty state

`FlatList` handles the populated case with `keyExtractor` on the Sunnah ID. There is no `ListEmptyComponent`; the empty state is a sibling branch of a ternary. That is a reasonable choice here because the empty state is a fully centred layout with decorative images that would be awkward to express inside a list's content container.

The empty state card layers the same two corner decoration PNGs used by the Sunnah card, positioned with negative offsets so they bleed off the corners, at 50% opacity.

## Layout

`contentContainerClassName="px-5 pb-[90px] pt-2"` — the bottom padding clears the absolutely positioned tab bar. The screen applies `insets.top + 12` to an outer `View` rather than to the list's content container, because the heading and stats sit outside the scrolling region and only the list should scroll under the safe area.

## Extension notes

- **A detail view** would need routing, which does not exist for these items today; the card is a plain `View`, not pressable.
- **Grouping by month** would use `completedAt`, but must handle the `null` case for migrated records — probably as a trailing "earlier" section.
- **Do not** derive `totalCompleted` from `accomplishedSunnahs.length` in the UI. The stored counter is authoritative and the two are allowed to differ for the reasons above.
