import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { REMINDER_SLOT_TIMES } from "@/constants/reminders";
import { palette } from "@/constants/theme";
import { calculatePrayerTimes } from "@/services/prayerTimes";
import { PrayerTimesResult, Routine } from "@/types";
import { pickRandom } from "@/utils/array";

// ─── Notification Handler ─────────────────────────────────────────────────────
// Must be called once after the native bridge is ready (from a useEffect),
// NOT at module level — some devices crash if the bridge isn't initialised yet.
let handlerInitialized = false;

export function initNotificationHandler() {
  if (handlerInitialized) return;
  handlerInitialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    handlerInitialized = false;
    console.warn("Failed to set notification handler:", e);
  }
}

// ─── Channel IDs ─────────────────────────────────────────────────────────────
const CHANNEL_REMINDERS = "sunnah_reminders";
const CHANNEL_CHECKIN = "sunnah_checkin";
const CHANNEL_STREAK = "sunnah_streak";

// ─── Notification identifier prefixes ────────────────────────────────────────
const PREFIX_REMINDER = "reminder";
const PREFIX_CHECKIN = "checkin";
const PREFIX_STREAK = "streak";

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function setupAndroidChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS, {
    name: "تذكيرات السنن",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_CHECKIN, {
    name: "مراجعة اليوم",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_STREAK, {
    name: "حماية السلسلة",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Schedule notifications for an active sunnah ─────────────────────────────

async function scheduleRoutineSnapshot(
  routine: Routine,
  endOfDayHour: number,
  endOfDayMinute: number,
  streakCount: number,
  isDoneToday: boolean,
  prayerTimes?: PrayerTimesResult | null,
  isCurrent: () => boolean = () => true,
) {
  // Always cancel old notifications first
  // Cancellation and permissions are handled by the serialized public entry point.

  const now = new Date();
  const daysToSchedule = 7;

  for (let offset = 0; offset < daysToSchedule; offset++) {
    if (!isCurrent()) return;
    // If done today, skip all notifications for today (offset 0)
    if (isDoneToday && offset === 0) continue;

    // 1. Contextual reminder notifications
    for (const slot of routine.notificationSchedule.reminderSlots) {
      if (!isCurrent()) return;
      let hour: number;
      let minute: number;

      if (slot === "morning") {
        let fajrHour: number;
        let fajrMinute: number;

        if (prayerTimes) {
          if (prayerTimes.latitude != null && prayerTimes.longitude != null) {
            const targetDay = new Date(now);
            targetDay.setDate(now.getDate() + offset);
            const dayTimes = calculatePrayerTimes(
              prayerTimes.latitude,
              prayerTimes.longitude,
              targetDay,
            );
            fajrHour = dayTimes.fajr.hour;
            fajrMinute = dayTimes.fajr.minute;
          } else {
            fajrHour = prayerTimes.fajr.hour;
            fajrMinute = prayerTimes.fajr.minute;
          }
        } else {
          fajrHour = REMINDER_SLOT_TIMES.fajr.hour;
          fajrMinute = REMINDER_SLOT_TIMES.fajr.minute;
        }

        // Morning reminder = Fajr + 2.5 hours (150 mins)
        const totalMins = (fajrHour * 60 + fajrMinute + 150) % 1440;
        hour = Math.floor(totalMins / 60);
        minute = totalMins % 60;
      } else if (
        prayerTimes &&
        (slot === "fajr" ||
          slot === "dhuhr" ||
          slot === "asr" ||
          slot === "maghrib" ||
          slot === "ishaa")
      ) {
        if (prayerTimes.latitude != null && prayerTimes.longitude != null) {
          const targetDay = new Date(now);
          targetDay.setDate(now.getDate() + offset);
          const dayTimes = calculatePrayerTimes(
            prayerTimes.latitude,
            prayerTimes.longitude,
            targetDay,
          );
          hour = dayTimes[slot].hour;
          minute = dayTimes[slot].minute;
        } else {
          hour = prayerTimes[slot].hour;
          minute = prayerTimes[slot].minute;
        }
      } else {
        hour = REMINDER_SLOT_TIMES[slot].hour;
        minute = REMINDER_SLOT_TIMES[slot].minute;
      }
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);
      targetDate.setHours(hour, minute, 0, 0);

      // Only schedule if the time hasn't passed
      if (targetDate > now) {
        const message = pickRandom(routine.notificationMessages);
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_REMINDER}_${slot}_day${offset}`,
          content: {
            title: routine.title,
            body: message,
            data: { type: "reminder", routineId: routine.id },
            color: palette.warmGold,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
            channelId: CHANNEL_REMINDERS,
          },
        });
      }
    }

    // 2. End-of-day check-in
    if (!isCurrent()) return;
    if (routine.notificationSchedule.endOfDayCheckIn) {
      const checkInDate = new Date(now);
      checkInDate.setDate(now.getDate() + offset);
      checkInDate.setHours(endOfDayHour, endOfDayMinute, 0, 0);

      if (checkInDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_CHECKIN}_day${offset}`,
          content: {
            title: "كيف كان يومك؟ 🌙",
            body: `هل التزمت اليوم بروتين «${routine.title}»؟`,
            data: { type: "checkin", routineId: routine.id },
            color: palette.warmGold,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: checkInDate,
            channelId: CHANNEL_CHECKIN,
          },
        });
      }
    }

    // 3. Streak protection (30 min before end-of-day check-in, only if streak > 0)
    if (!isCurrent()) return;
    if (streakCount > 0) {
      const streakDate = new Date(now);
      streakDate.setDate(now.getDate() + offset);

      // Explicit minute arithmetic to avoid negative minutes
      const totalCheckInMinutes = endOfDayHour * 60 + endOfDayMinute;
      const streakTotalMinutes = (totalCheckInMinutes - 30 + 1440) % 1440;
      const streakHour = Math.floor(streakTotalMinutes / 60);
      const streakMinute = streakTotalMinutes % 60;

      streakDate.setHours(streakHour, streakMinute, 0, 0);

      if (streakDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_STREAK}_day${offset}`,
          content: {
            title: "لا تكسر سلسلتك! ✨",
            body: `أنت في اليوم ${streakCount + 1} من ${routine.streakDays ?? 7} لروتين «${routine.title}»`,
            data: { type: "streak", routineId: routine.id },
            color: palette.warmGold,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: streakDate,
            channelId: CHANNEL_STREAK,
          },
        });
      }
    }
  }
}

let notificationWork = Promise.resolve();
let latestRequest = 0;

/** All cancellation, permission checks and scheduling share one queue. A newer
 * snapshot always cancels the previous snapshot, including legacy v2 reminders. */
export function scheduleRoutineNotifications(
  routine: Routine | null,
  endOfDayHour: number,
  endOfDayMinute: number,
  streakCount: number,
  isDoneToday: boolean,
  prayerTimes?: PrayerTimesResult | null,
  enabled = true,
): Promise<void> {
  const request = ++latestRequest;
  notificationWork = notificationWork
    .catch(() => {})
    .then(async () => {
      if (request !== latestRequest) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!enabled || !routine || request !== latestRequest) return;
      if (!(await requestPermissions()) || request !== latestRequest) return;
      try {
        await scheduleRoutineSnapshot(
          routine,
          endOfDayHour,
          endOfDayMinute,
          streakCount,
          isDoneToday,
          prayerTimes,
          () => request === latestRequest,
        );
      } catch (error) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        throw error;
      }
    });
  return notificationWork;
}

export function cancelAllNotifications() {
  return scheduleRoutineNotifications(null, 22, 0, 0, false, null, false);
}
