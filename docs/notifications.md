# Notifications

Three kinds of local reminder, timed to the user's prayer times and their chosen end-of-day hour, scheduled a week ahead. No push server is involved.

---

# Part 1 — User Guide

## Why the app sends reminders

A habit you forget is a habit you do not have. Sunan's reminders are timed to the moment the Sunnah is actually relevant — a reminder about table manners arrives around meal times, a reminder about post-prayer remembrance arrives after a prayer.

## The three kinds of reminder

**Contextual reminders.** These are the main ones. Each Sunnah has its own set of times that suit it, anchored to prayer times where that makes sense. The title is the Sunnah's name and the body is a short nudge, varied so the same sentence does not arrive every day — for example «قبل ما تاكل، قول بسم الله 🍽️» or «التسمية بركة في الطعام».

**The end-of-day check-in.** Once a day, at a time you choose (10:00 PM by default), the app asks **«كيف كان يومك؟ 🌙»** with the body «هل التزمت اليوم بـ «...»؟». This is your prompt to open the app and mark the day if you have not already.

**Streak protection.** If you have at least one day in your current streak, a more urgent reminder arrives **thirty minutes before** the check-in: **«لا تكسر سلسلتك! ✨»**, telling you which day of seven you are on. It exists to catch you before midnight costs you the streak.

## Once you have marked the day

The app stops bothering you. All of today's remaining reminders — contextual, check-in, and streak protection — are cancelled the moment you tap **فعلتها اليوم**.

## What you control

In **الإعدادات** you can turn all notifications off with a single switch, and you can choose the check-in time. You cannot currently turn off one kind and keep another, or edit individual reminder times. See [settings.md](./settings.md).

## Permissions

The app asks for notification permission once, shortly after it first opens. If you decline, everything else keeps working — you simply get no reminders. You can grant it later from your device's system settings; the app will pick it up the next time it schedules.

## Tapping a reminder

Tapping any notification opens the app on the home tab, whether the app was closed or already running in the background.

## On Android

Reminders are filed under three separate channels you can manage from Android's own settings: **تذكيرات السنن**, **مراجعة اليوم**, and **حماية السلسلة**. Multiple unread reminders collapse into a single summary reading «سُنن — N تذكيرات».

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `services/notifications.ts` | Handler, channels, permissions, all scheduling |
| `context/SunnahContext.tsx` | The effect that triggers rescheduling |
| `constants/data.ts` | Per-Sunnah `notificationSchedule` / `notificationMessages`, and `REMINDER_SLOT_TIMES` |
| `services/prayerTimes.ts` | `calculatePrayerTimes`, consumed for slot resolution |
| `app/_layout.tsx` | Permission request on boot, tap handling |
| `app.json` | `expo-notifications` plugin, Android collapse behaviour |
| `utils/array.ts` | `pickRandom` |

Everything is `expo-notifications` with local `DATE` triggers. There is no Expo push token, no server, and no background task.

## Foreground handler

Set at module scope, deliberately not inside a component:

`services/notifications.ts:10-17`

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

`expo-notifications` requires the handler to be registered before any notification can be delivered, which means before the first component mounts. Because `app/_layout.tsx` imports `requestPermissions` from this module, importing the module is enough to run this. `shouldSetBadge: false` is intentional — an app-icon badge would imply an unread count the app has no concept of.

## Android channels

Three channels, created on every launch (the call is idempotent) from the context's init effect:

| Constant | ID | Arabic name | Importance | Vibration |
| --- | --- | --- | --- | --- |
| `CHANNEL_REMINDERS` | `sunnah_reminders` | تذكيرات السنن | `HIGH` | `[0, 250, 250, 250]` |
| `CHANNEL_CHECKIN` | `sunnah_checkin` | مراجعة اليوم | `DEFAULT` | — |
| `CHANNEL_STREAK` | `sunnah_streak` | حماية السلسلة | `HIGH` | `[0, 400, 200, 400]` |

Separate channels exist so Android users can silence one class of reminder without losing the others, which is the only granular control available since the in-app settings are all-or-nothing. The streak channel's longer vibration pattern is a deliberate escalation.

`setupAndroidChannels` returns early on non-Android platforms.

## Identifier scheme

Every scheduled notification gets a deterministic identifier built from a prefix and the day offset:

- `reminder_{slot}_day{offset}`
- `checkin_day{offset}`
- `streak_day{offset}`

This is what makes rescheduling safe. `cancelSunnahNotifications` enumerates everything scheduled and cancels only entries whose identifier starts with one of the three prefixes, so the app never clears notifications it did not create. Since identifiers are deterministic, re-scheduling the same slot on the same day overwrites rather than duplicates.

`cancelAllNotifications` is the blunt instrument (`cancelAllScheduledNotificationsAsync`) and is used when notifications are switched off entirely or there is no active Sunnah.

## The scheduling trigger

All scheduling flows through one effect:

`context/SunnahContext.tsx:112-144`

```tsx
  useEffect(() => {
    if (isLoading) return;
    if (!currentSunnahId) {
      cancelAllNotifications();
      return;
    }
    const sunnah = SUNNAHS.find((s) => s.id === currentSunnahId);
    if (!sunnah) {
      cancelAllNotifications();
      return;
    }

    const today = todayStr();
    const hasMarkedToday = streakDates.includes(today);

    if (settings.notificationsEnabled) {
      (async () => {
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          scheduleSunnahNotifications(/* ... */);
        }
      })();
    } else {
      cancelAllNotifications();
    }
  }, [currentSunnahId, settings, streakDates, isLoading, prayerTimes]);
```

Five dependencies, each a real reason to reschedule: a new Sunnah has different slots and messages; changed settings move the check-in or disable everything; a new streak entry means today's reminders are obsolete and the streak-protection body's day number has changed; `isLoading` gates the whole thing until persisted state has arrived; and `prayerTimes` arriving asynchronously after launch must replace the fallback-timed schedule.

The `isLoading` guard is essential — without it the effect would fire once against the initial empty state and schedule against a `null` Sunnah.

The consequence of depending on `streakDates` is that **every mark-done reschedules all seven days**. That is a lot of native calls for one tap, but it is correct and the alternative (diffing) is not worth the complexity at this volume.

## The scheduling loop

`scheduleSunnahNotifications` cancels the app's own notifications first, then loops `offset` from 0 to 6, scheduling into a rolling seven-day window. Because rescheduling happens on essentially every state change, the window is continually refreshed and never actually runs dry.

The first thing in the loop is the "already done" skip:

`services/notifications.ts:77-78`

```ts
    // If done today, skip all notifications for today (offset 0)
    if (isDoneToday && offset === 0) continue;
```

Every scheduled item is also guarded by `if (targetDate > now)`, so times already past today are dropped rather than firing immediately — `expo-notifications` would otherwise deliver a `DATE` trigger in the past on the spot.

### Resolving a slot to a clock time

`ReminderSlot` is a union of eight values with three resolution strategies.

**Prayer-anchored slots** (`fajr`, `dhuhr`, `asr`, `maghrib`, `ishaa`) recalculate the prayer time **for the specific target day**, not just once:

`services/notifications.ts:121-131`

```ts
        if (prayerTimes.latitude != null && prayerTimes.longitude != null) {
          const targetDay = new Date(now);
          targetDay.setDate(now.getDate() + offset);
          const dayTimes = calculatePrayerTimes(
            prayerTimes.latitude,
            prayerTimes.longitude,
            targetDay
          );
          hour = dayTimes[slot].hour;
          minute = dayTimes[slot].minute;
        } else {
```

This matters because prayer times drift by a minute or more per day. Scheduling a week of Fajr reminders at today's Fajr time would be visibly wrong by day seven, especially near the solstices or at high latitude. When coordinates are unavailable the code falls back to the single set of times on the `PrayerTimesResult`, and failing that to `REMINDER_SLOT_TIMES`.

**`morning` is derived**, not a prayer: Fajr plus 150 minutes, with modular arithmetic so the wrap past midnight cannot produce an invalid hour:

`services/notifications.ts:109-112`

```ts
        // Morning reminder = Fajr + 2.5 hours (150 mins)
        const totalMins = (fajrHour * 60 + fajrMinute + 150) % 1440;
        hour = Math.floor(totalMins / 60);
        minute = totalMins % 60;
```

The intent is "after the user is properly awake" rather than any fixed clock time, so it tracks Fajr across the seasons.

**`afternoon` and `before_sleep`** have no prayer anchor and always resolve from the static table.

### Fallback slot times

`constants/data.ts:33-45`

```ts
export const REMINDER_SLOT_TIMES: Record<
  ReminderSlot,
  { hour: number; minute: number }
> = {
  fajr: { hour: 5, minute: 0 },
  morning: { hour: 7, minute: 30 },
  dhuhr: { hour: 12, minute: 30 },
  asr: { hour: 15, minute: 30 },
  afternoon: { hour: 15, minute: 30 },
  maghrib: { hour: 18, minute: 30 },
  ishaa: { hour: 20, minute: 0 },
  before_sleep: { hour: 22, minute: 0 },
};
```

Note that `morning`'s static value (07:30) is *not* the derived value (Fajr + 2.5h ≈ 07:30 for a 05:00 Fajr) — the table is a plausible-anywhere default used only when no location is available at all. This table is shared with `getFallbackTimes()` in the prayer times service.

### Message selection

`pickRandom(sunnah.notificationMessages)` samples per notification, with replacement:

`utils/array.ts:1-3`

```ts
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
```

Sampling with replacement means repeats are possible across a day. With a pool of two or three messages that is a reasonable trade for keeping the function trivial. A pool of one produces identical reminders forever, which is why the catalog convention is at least two.

Note that messages are baked in at schedule time, so the pool is sampled once per slot per day and does not re-randomise until the next reschedule.

### Streak protection arithmetic

`services/notifications.ts:191-194`

```ts
      const totalCheckInMinutes = endOfDayHour * 60 + endOfDayMinute;
      const streakTotalMinutes = (totalCheckInMinutes - 30 + 1440) % 1440;
      const streakHour = Math.floor(streakTotalMinutes / 60);
      const streakMinute = streakTotalMinutes % 60;
```

The `+ 1440` before the modulo handles a check-in set to 00:00 or 00:15, where naive subtraction gives a negative value and JavaScript's `%` preserves the sign. The comment in the source flags this explicitly.

The body interpolates `streakCount + 1` — the day the user is *about to* complete, not the count already banked.

## Boot-time permission and tap handling

`app/_layout.tsx` requests permission once fonts have loaded, so the prompt does not compete with the splash screen:

`app/_layout.tsx:101-107`

```tsx
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Request notification permissions once fonts are loaded
      requestPermissions().catch(console.warn);
    }
  }, [fontsLoaded]);
```

`requestPermissions` checks the existing status before prompting, so a user who has already granted or denied is never re-prompted by this call.

Taps are handled twice, because the two cases are genuinely different APIs:

- **Cold start** — `Notifications.useLastNotificationResponse()`, filtered on `DEFAULT_ACTION_IDENTIFIER` so only a tap on the notification body (not a dismissal or an action button) navigates.
- **Warm** — `addNotificationResponseReceivedListener`, with the subscription removed on cleanup.

Both call `router.replace("/(tabs)")`. `replace` rather than `push` avoids stacking duplicate routes if several notifications are tapped in succession. The notification's `data` payload carries `type` and `sunnahId`, but neither is currently used for routing — every tap lands on the home tab.

## App config

`app.json:37-40`

```json
    "notification": {
      "androidMode": "collapse",
      "androidCollapsedTitle": "سُنن — #{unread_notifications} تذكيرات"
    },
```

Collapse mode matters because a Sunnah with three contextual slots plus a check-in plus streak protection can produce five notifications in a day; without collapsing, the shade would be dominated by one app.

The `expo-notifications` plugin sets the Android small-icon accent colour to `#C4A46C` (`palette.warmGold`).

## Limitations and gotchas

- **The seven-day window is only as fresh as the last reschedule.** If a user never opens the app, reminders stop after seven days. In practice the check-in should bring them back well before that.
- **No `SchedulableTriggerInputTypes.DAILY`.** Explicit per-day `DATE` triggers are used instead, because each day's prayer-anchored times differ and a daily repeating trigger cannot express that.
- **iOS caps pending notifications at 64.** A Sunnah with many slots over seven days plus check-ins and streak reminders is currently well under that, but adding slots liberally could silently drop the tail of the window.
- **Marking done cancels today only.** Tomorrow's reminders remain scheduled, which is correct — the streak continues.
- **Turning notifications back on** re-runs the effect through the `settings` dependency, so no manual re-schedule is needed.
