# Settings (الإعدادات)

The third tab. Three sections: notifications, information about the app, and data management.

---

# Part 1 — User Guide

## الإشعارات — Notifications

**تفعيل الإشعارات** — one switch for every reminder the app sends. Turn it off and all pending reminders are cancelled immediately; turn it back on and they are re-created. Described as «تذكيرات يومية وتنبيهات السلسلة».

**تذكير نهاية اليوم** — the time of the daily «هل فعلت السنة اليوم?» check-in. Tap the time to open a picker. It defaults to 10:00 PM and is disabled (greyed out) while notifications are switched off.

The picker gives you a live preview of your choice, **صباحاً (ص)** / **مساءً (م)** buttons, a plus/minus stepper for the hour, and a plus/minus stepper for the minutes that moves in fifteen-minute steps. Confirm with **تأكيد** or discard with **إلغاء**.

Remember that the streak-protection reminder is tied to this time — it arrives thirty minutes earlier. Setting the check-in very early in the morning will place both reminders at times that are unlikely to be useful.

**أوقات الصلاة** — a status row rather than a control. When the app has your location it reads **«أوقات دقيقة حسب موقعك»** with a gold check mark. Otherwise it reads **«أوقات صلاة تقريبية»** and offers a **تحديث** button to try again. See [prayer-times.md](./prayer-times.md).

## عن التطبيق — About

**إعادة عرض الشرح** — tap **عرض الشرح** to replay the introductory tour. You are taken to the home tab and the tour begins from the first step. See [onboarding-tour.md](./onboarding-tour.md).

**الإشعارات مخصصة لكل سنة** — informational: «كل سنة لها أوقات تذكير مناسبة لها، مثل تذكير الطعام عند أوقات الأكل.»

**خصوصية بياناتك** — informational: «تُحسب أوقات الصلاة محلياً على جهازك دون اتصال. بياناتك محفوظة محلياً ولا نجمعها.»

## إدارة البيانات — Data management

**إعادة ضبط التقدم** — the **مسح وبدء من جديد** button, styled in red. A confirmation warns **«إعادة ضبط البيانات؟»** and that all statistics, streaks, and completed Sunnahs will be erased and the app will start again from the first Sunnah.

**This cannot be undone.** There is no backup and no export. Everything lives on this device only.

What is erased: your achievements, your current streak, your longest streak, your completed count, your skipped Sunnahs, and your notification settings (which return to on, 10:00 PM).

What is *not* erased: the introductory tour stays marked as seen, so it will not replay on its own, and your saved location remains, so prayer times keep working.

## Version

The bottom of the screen shows **«سنن · الإصدار 1.0.0»**.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `app/(tabs)/settings.tsx` | Route file |
| `screens/Settings/index.tsx` | The screen |
| `screens/Settings/components/SettingRow.tsx` | Label / description / control row |
| `screens/Settings/components/TimePicker.tsx` | Custom 12-hour picker modal |
| `screens/Settings/components/ResetModal.tsx` | Reset confirmation |
| `context/SunnahContext.tsx` | `settings`, `updateSettings`, `resetAllProgress` |
| `services/storage.ts` | `DEFAULT_SETTINGS`, `clearPersistedState` |
| `utils/date.ts` | `formatTime12h` |

## The settings model

Three fields, and that is the entire user-configurable surface:

`types/index.ts:59-63`

```ts
export interface UserSettings {
  endOfDayHour: number;
  endOfDayMinute: number;
  notificationsEnabled: boolean;
}
```

Defaults live with the storage layer rather than the screen, because `loadPersistedState` merges them over whatever it reads:

`services/storage.ts:9-13`

```ts
export const DEFAULT_SETTINGS: UserSettings = {
  endOfDayHour: 22,
  endOfDayMinute: 0,
  notificationsEnabled: true,
};
```

Hour and minute are stored as separate numbers rather than a `"HH:mm"` string or a `Date`. This matches what the notification scheduler needs — it calls `setHours(hour, minute)` — and avoids any timezone semantics attaching to a stored time-of-day. `utils/date.ts` does provide `parseTime` for `"HH:mm"` strings, but nothing currently uses it.

## Partial updates

`context/SunnahContext.tsx:260-269`

```tsx
  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      savePersistedState({
        ...stateRef.current,
        settings: next,
      });
      return next;
    });
  }, []);
```

`Partial<UserSettings>` lets each control send only its own field. The persistence call happens **inside** the updater function so that `next` is computed from the guaranteed-current `prev` — writing from outside the updater would risk persisting a value derived from a stale `settings` closure. The empty dependency array is sound precisely because nothing outside is read except `stateRef`, which is a ref.

Note the write is fire-and-forget: `savePersistedState` swallows its own errors, so a storage failure leaves the in-memory setting applied but not durable. This is a deliberate simplification — there is no rollback UI.

Every settings change reschedules notifications, because `settings` is a dependency of the scheduling effect. See [notifications.md](./notifications.md).

## `SettingRow`

A three-slot layout primitive: bold label, optional description, and a `right` node for the control. The row owns its bottom hairline (`border-b border-warmGold/10`), which is why the containing card has no dividers of its own — this means the *last* row in each card also draws a border, a minor cosmetic artefact of the simpler approach.

The margins are RTL-flipped by hand (`ml-4` on the text block, `mr-1` on the control) rather than using logical properties, consistent with the rest of the codebase running under a forced-RTL layout.

Note that `right` is typed as required. Every current row supplies one, including the purely informational rows, which pass a decorative `Ionicons` element.

## Notification controls

The switch is a plain React Native `Switch` with palette colours (`switchTrackFalse` when off, `warmGold` when on). It writes straight through `updateSettings`.

The time button is disabled off `!settings.notificationsEnabled` and carries a matching `accessibilityState={{ disabled: ... }}` along with a label that includes the current time, so a screen reader announces the value rather than just "button". Its text colour drops to `text-warmBrownLight/40` when disabled.

The prayer-times row is the only one whose *description* is computed:

`screens/Settings/index.tsx:107-113`

```tsx
            description={
              prayerTimes?.source === "calc" ||
              prayerTimes?.source === "api" ||
              prayerTimes?.source === "cache"
                ? "أوقات دقيقة حسب موقعك"
                : "أوقات صلاة تقريبية"
            }
```

Three sources are treated as "accurate", including the vestigial `api`. The refresh button is offered only for `fallback` or a `null` result — which means a user with valid but *stale* cached coordinates has no way to update them from this screen. That gap is noted in [prayer-times.md](./prayer-times.md).

## The time picker

A custom `Modal` rather than a platform date-time picker. That is a deliberate choice: `@react-native-community/datetimepicker` is not in the dependency list, and the native iOS and Android pickers have very different appearances and neither respects the app's parchment-and-gold styling or its Arabic AM/PM markers (ص / م).

State is local to the modal and synced from props on open, so cancelling discards:

`screens/Settings/components/TimePicker.tsx:22-27`

```tsx
  useEffect(() => {
    if (visible) {
      setH(hour);
      setM(minute);
    }
  }, [visible, hour, minute]);
```

Internally the hour is kept in 24-hour form and converted for display, which keeps the AM/PM toggle a simple ±12 and means the value handed to `onConfirm` needs no conversion.

The hour stepper wraps within the current period rather than crossing it:

`screens/Settings/components/TimePicker.tsx:41-50`

```tsx
  const adjustHour = (delta: number) => {
    setH((prev) => {
      const currentPeriod = prev >= 12;
      const currentH12 = prev % 12;
      // Calculate new 12-hour value (0 to 11 internally)
      let nextH12 = (currentH12 + delta) % 12;
      if (nextH12 < 0) nextH12 += 12;
      return nextH12 + (currentPeriod ? 12 : 0);
    });
  };
```

So stepping up from 11 AM gives 12 AM, not 12 PM — the period is changed only by the explicit ص/م buttons. Whether that is the right model is debatable, but it is consistent and never produces an invalid hour. The `nextH12 < 0` correction exists because JavaScript's `%` returns a negative remainder for negative operands.

Minutes move in fifteens with explicit wrap: `(prev + 15) % 60` up, `prev === 0 ? 45 : prev - 15` down. The coarse granularity is intentional — a check-in reminder does not need minute precision, and it keeps the control to four positions.

`formatTime12h` renders the live preview and the row's label:

`utils/date.ts:35-40`

```ts
export function formatTime12h(hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const period = hour >= 12 ? "م" : "ص";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${pad(h12)}:${pad(minute)} ${period}`;
}
```

The `hour % 12 === 0 ? 12` branch handles both midnight and noon, which naive modulo would render as "00".

`onConfirm(h, m)` sends both fields in a single `updateSettings` call, so only one persist and one reschedule occur.

## Replaying the tour

`screens/Settings/index.tsx:21-22`

```tsx
/** Lets the home tab mount and lay out before the tour measures its targets. */
const REPLAY_NAVIGATION_DELAY = 350;
```

`screens/Settings/index.tsx:40-43`

```tsx
  const handleReplayTour = () => {
    router.navigate("/");
    setTimeout(startTour, REPLAY_NAVIGATION_DELAY);
  };
```

The delay is unavoidable given how the tour works: `startTour` immediately triggers measurement of targets that live on the home screen, and those targets do not exist until that screen has mounted and laid out. A timeout is a blunt instrument — a slow device could still lose the race — but the tour's own measurement retry loop (five attempts, 120 ms apart) provides the real safety net. See [onboarding-tour.md](./onboarding-tour.md).

`router.navigate` is used rather than `replace` so the tab navigator's own state handles the switch normally.

## Reset

`context/SunnahContext.tsx:275-287`

```tsx
  const resetAllProgress = useCallback(async () => {
    await clearPersistedState();
    const initialId = nextSunnahId(null, [], []);
    setCurrentSunnahId(initialId);
    setStreakDates([]);
    setAccomplishedIds([]);
    setAccomplishedRecords([]);
    setSkippedIds([]);
    setSettings(DEFAULT_SETTINGS);
    setTotalCompleted(0);
    setLongestStreak(0);
    setStreakBrokenToday(false);
  }, []);
```

The storage key is **removed**, not overwritten with an initial state. The next load therefore takes the "no stored value" branch in `loadPersistedState` and reconstructs defaults from scratch — one code path for a fresh install and a reset.

In-memory state is then reset to match, rather than relying on a reload, and `nextSunnahId(null, [], [])` re-derives the first Sunnah rather than hardcoding `"1"`, so a reset respects the current catalog order and any `deprecated` flags.

Because `settings` returns to `DEFAULT_SETTINGS` and `currentSunnahId` changes, the scheduling effect fires and rebuilds the notification window for the first Sunnah.

### What reset deliberately does not clear

Two AsyncStorage keys are untouched:

- `@sonan_onboarding_v1` — the tour would otherwise auto-replay after every reset, which would read as a bug rather than a feature. Users who want it can replay it explicitly.
- `@sonan_user_coords` — clearing it would re-prompt for location permission, and location is not "progress".

This is the correct behaviour for a "reset progress" action rather than a "clear all app data" action, but it does mean the reset is not a true factory reset. Anything added to storage in future needs a conscious decision about which category it falls into. See [data-persistence.md](./data-persistence.md).

The screen dismisses the modal before awaiting the reset, so the confirmation does not sit on screen during the storage write.

## Notes

- The version string in the footer is hardcoded and duplicates `app.json`'s `version`. `expo-constants` is already a dependency and could source it from `Constants.expoConfig?.version` instead.
- The section headings are plain `Text` with `mr-1`, not a component — there are only three.
- `screens/Settings/index.tsx` imports `palette` for the switch colours only; everything else is NativeWind classes.
