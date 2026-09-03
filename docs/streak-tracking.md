# Streak Tracking

The seven-day mechanic at the heart of the app: marking a day done, the dots, the milestone banners, what happens when a day is missed, and the celebration on day seven.

---

# Part 1 — User Guide

## The seven-day rule

A Sunnah becomes an accomplishment when you practise it on **seven consecutive days**. Seven dots sit above the card, numbered one to seven.

- A **filled gold dot with a check mark** is a day you completed.
- The **next dot** is slightly larger with a gold outline — that is today's target.
- **Empty dots** are the days still ahead.

The small connectors between the dots fill in behind you as you go, so the row reads as a chain rather than a set of separate marks.

## Marking a day

Tap **فعلتها اليوم** after you have performed the Sunnah. You will feel a short vibration, a dot fills, and the button changes to **«تم إنجازها اليوم»** and becomes unavailable for the rest of the day. You cannot mark the same day twice, and there is no way to un-mark a day.

There is no deadline for marking a day other than midnight — the app works on calendar days in your device's local time, not on a rolling 24-hour window.

## Encouragement along the way

Two banners appear above the dots at specific points:

- On **day 3**: «رائع! لقد تجاوزت النصف»
- On **day 6**: «يوم واحد بقي! تحلَّ بالصبر»

## Completing the streak

When you mark the seventh day, gold and green confetti bursts across the screen and a card appears reading **«مبارك!»** followed by «أتممت 7 أيام متتالية لسنة «...». جزاك الله خيراً». Tap **متابعة** to dismiss it.

Behind that card, several things have already happened: the Sunnah has been added to your achievements, your completed count has gone up, the dots have reset to empty, and the next Sunnah is now on the card.

## Missing a day

Missing a day breaks the streak. If you open the app and a full calendar day has passed with no mark, a red banner appears at the top: **«انقطعت سلسلتك بسبب يوم فائت. ابدأ من جديد!»** The dots reset to zero and you start the same Sunnah again from day one.

Note the exact rule: the streak breaks when the **gap is two days or more** between your last marked day and today. Marking Monday and then opening the app on Tuesday is fine, whether or not you have marked Tuesday yet. Marking Monday and opening the app on Wednesday breaks it.

The banner is informational only — it appears once, when the app notices, and it does not block anything.

## Your longest streak

Your best-ever run is recorded and shown on the achievements tab as **أطول سلسلة**. Breaking a streak does not reduce it.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `context/SunnahContext.tsx` | `markDoneToday`, the streak state, the completion transition |
| `utils/streak.ts` | `appendStreakDate` — the append/reset decision |
| `utils/date.ts` | `todayStr`, `daysBetween` |
| `services/storage.ts` | Streak continuity validation on load |
| `screens/ActiveSunnah/components/StreakDots.tsx` | The dot row |
| `screens/ActiveSunnah/components/MilestoneBanner.tsx` | Day 3 and day 6 copy |
| `screens/ActiveSunnah/components/StreakCompleteModal.tsx` | Confetti and completion card |
| `screens/ActiveSunnah/index.tsx` | Mark-done handler, broken-streak banner |

## Representation: dates, not a counter

The streak is stored as an **array of ISO date strings**, not an integer:

`types/index.ts:76-76`

```ts
  streakDates: string[]; // ISO date strings 'YYYY-MM-DD'
```

`streakCount` and `hasMarkedToday` are both derived:

`context/SunnahContext.tsx:147-149`

```tsx
  const today = todayStr();
  const hasMarkedToday = streakDates.includes(today);
  const streakCount = streakDates.length;
```

This is the single most important design decision in the feature. A bare counter cannot answer "was the last mark yesterday or last month?", which means it cannot detect a broken streak, and it is trivially inflated by a user changing the device clock forward and tapping repeatedly. Storing the dates makes both idempotency (`includes(today)`) and continuity checking fall out for free.

## Date handling

`todayStr()` builds `YYYY-MM-DD` from **local** getters, deliberately not `toISOString()`, which would return the UTC date and shift the user's day boundary by up to a day either side of midnight.

`daysBetween()` then converts both date strings back through `Date.UTC` before subtracting:

`utils/date.ts:16-22`

```ts
export function daysBetween(a: string, b: string): number {
  const [yA, mA, dA] = a.split("-").map(Number);
  const [yB, mB, dB] = b.split("-").map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round(Math.abs(utcB - utcA) / 86_400_000);
}
```

The combination is intentional: local time decides *which calendar day it is*, then UTC midnights are used purely as arithmetic anchors so a DST transition cannot make two adjacent days 23 or 25 hours apart and round to the wrong integer. `Math.abs` makes the function order-independent, and `Math.round` absorbs any residual millisecond noise.

## Appending a day

`utils/streak.ts:8-22`

```ts
export function appendStreakDate(currentStreakDates: string[]): string[] {
  const today = todayStr();
  if (currentStreakDates.length === 0) {
    return [today];
  }
  const lastDate = currentStreakDates[currentStreakDates.length - 1];
  if (lastDate === today) {
    return currentStreakDates;
  }
  const gap = daysBetween(lastDate, today);
  if (gap >= 2) {
    return [today];
  }
  return [...currentStreakDates, today];
}
```

Four cases, in order: empty streak starts fresh; already marked today is a no-op returning the *same array reference* (so React bails out of the re-render); a gap of two or more days silently restarts at today; otherwise append.

The function is pure and returns a new array rather than mutating, which is what lets the caller compare lengths to detect completion.

## The mark-done transition

`markDoneToday` guards on `hasMarkedToday || !currentSunnahId` and then branches on whether the new length reaches seven.

Under seven, it writes the new dates and the possibly-updated longest streak. At seven, it performs the whole completion transition in one batch:

`context/SunnahContext.tsx:160-189`

```tsx
    if (newStreak >= 7) {
      // Completed 7-day streak
      const newAccomplished = [...accomplishedIds, currentSunnahId];
      const newRecords: AccomplishedRecord[] = [
        ...accomplishedRecords,
        {
          id: currentSunnahId,
          completedAt: todayStr(),
          method: "streak",
        },
      ];
      const newTotal = totalCompleted + 1;
      const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);
      // ...six setState calls...
      savePersistedState({
        ...stateRef.current,
        currentSunnahId: newId,
        streakDates: [],
        // ...
      });
```

Note `nextSunnahId` is passed `newAccomplished`, not `accomplishedIds` — the just-completed Sunnah must already be excluded or rotation would hand it straight back.

`longestStreak` is computed as `Math.max(longestStreak, newStreak)` on **every** mark, not only at completion, so a run that breaks at day five still records five.

### Why `stateRef`

The persistence call spreads `stateRef.current`, a ref that is reassigned on every render:

`context/SunnahContext.tsx:65-74`

```tsx
  stateRef.current = {
    currentSunnahId,
    streakDates,
    accomplishedIds,
    accomplishedRecords,
    skippedIds,
    settings,
    totalCompleted,
    longestStreak,
  };
```

This exists because `savePersistedState` needs the *whole* persisted object, but the action only knows the fields it changed. Reading the unchanged fields from the `useCallback` closure would risk writing stale values if two actions fired between renders. Spreading the ref and then overriding the changed keys guarantees the write is a complete, current snapshot. The trade-off is that the ref assignment happens during render, which is technically a side effect — acceptable here because it is an idempotent mirror of state, but it is the reason this pattern should not be copied casually.

## Detecting a broken streak

Detection happens **only on load**, in `services/storage.ts`, not while the app is running:

`services/storage.ts:64-74`

```ts
    // Validate streak continuity on load
    let validStreak = p.streakDates ?? [];
    let broken = false;
    if (validStreak.length > 0) {
      const lastDate = validStreak[validStreak.length - 1];
      const gap = daysBetween(lastDate, today);
      if (gap >= 2) {
        validStreak = [];
        broken = true;
      }
    }
```

When a break is detected the cleared state is immediately written back, so the banner shows once and does not reappear on the next launch. The flag travels to the context as a separate return value (`LoadedStateResult.streakBroken`) rather than being inferred from the state, because an empty streak array is indistinguishable from a brand-new install.

`streakBrokenToday` is never reset while the app is open — the banner stays for the session. `appendStreakDate` independently handles the same gap condition, which covers the case where the app is left open across a missed day.

## Dot rendering

`StreakDots` is a `forwardRef` component (the tour measures it) that maps over `Array.from({ length: total })` with `total = 7` defaulting from a prop, so the seven-day rule is parameterised even though nothing currently overrides it.

Three visual states per dot are chosen by index comparison — `filled` (`i < count`), `current` (`i === count`), otherwise empty. The current dot is deliberately one step larger (`w-9 h-9` versus `w-8 h-8`) so today's target is identifiable without colour alone. Connectors use `i < count - 1`, meaning a connector fills only when the dots on *both* sides are complete.

## Milestones

`MilestoneBanner` is a lookup table returning `null` for every unlisted count:

`screens/ActiveSunnah/components/MilestoneBanner.tsx:5-8`

```tsx
  const milestones: Record<number, string> = {
    3: "رائع! لقد تجاوزت النصف",
    6: "يوم واحد بقي! تحلَّ بالصبر",
  };
```

The keys are *counts already achieved*, so the "halfway" banner shows while the user is working on day four. Adding a milestone is a one-line change.

## The celebration overlay

`StreakCompleteModal` is fired from the screen, not the context, and its trigger is checked before dispatch:

`screens/ActiveSunnah/index.tsx:101-102`

```tsx
		const completingStreak = streakCount === 6;
		const completedTitle = currentSunnah?.title;
```

`streakCount === 6` (not `7`) because the check runs before the mark is recorded.

Two implementation details are load-bearing:

- **It is not a React Native `<Modal>`.** On Android, `Modal` is backed by a native `Dialog` that clips children to its own measured bounds, which would cut the confetti off at the card's edges. Instead the component renders an absolutely positioned overlay with `StyleSheet.absoluteFillObject` at `zIndex: 1000`, and the confetti canvas at `zIndex: 2000` above it.
- **`ConfettiCanvas` stays mounted permanently.** Only the card is conditionally rendered. Unmounting the canvas on dismiss would tear down the Reanimated worklet state behind `useConfetti`, and the ref would be stale the next time `fire()` was called.

The burst is fired from an effect keyed on `visible`, with `reset()` on the falling edge so a second completion starts from a clean canvas. Origin is `{ x: 0.5, y: 0.25 }` — upper-middle, so particles fall across the card rather than from behind it.

## Known limitations

- **No backfill.** A user who forgets to open the app cannot mark yesterday. This is a deliberate integrity choice, but it means travel across time zones or a day without phone access costs the streak.
- **No clock-tampering defence.** Moving the device clock forward a day at a time lets a user complete a streak in minutes. Given there is no server and no competitive element, this is knowingly untreated.
- **Detection is load-time only.** A break that occurs while the app sits in the foreground past midnight is caught by `appendStreakDate` on the next mark, but the red banner will not appear until the next cold start.
