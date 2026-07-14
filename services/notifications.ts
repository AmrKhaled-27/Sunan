import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Sunnah, REMINDER_SLOT_TIMES, ReminderSlot } from '../constants/data';
import { PrayerTimesResult } from './prayerTimes';

// ─── Notification Handler ─────────────────────────────────────────────────────
// This must be called at the top level (before any component mounts)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Channel IDs ─────────────────────────────────────────────────────────────
const CHANNEL_REMINDERS = 'sunnah_reminders';
const CHANNEL_CHECKIN   = 'sunnah_checkin';
const CHANNEL_STREAK    = 'sunnah_streak';

// ─── Notification identifier prefixes ────────────────────────────────────────
const PREFIX_REMINDER = 'reminder';
const PREFIX_CHECKIN  = 'checkin';
const PREFIX_STREAK   = 'streak';

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS, {
    name: 'تذكيرات السنن',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_CHECKIN, {
    name: 'مراجعة اليوم',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_STREAK, {
    name: 'حماية السلسلة',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Schedule notifications for an active sunnah ─────────────────────────────

export async function scheduleSunnahNotifications(
  sunnah: Sunnah,
  endOfDayHour: number,
  endOfDayMinute: number,
  streakCount: number,
  isDoneToday: boolean,
  prayerTimes?: PrayerTimesResult | null
) {
  // Always cancel old notifications first
  await cancelSunnahNotifications();

  const now = new Date();
  const daysToSchedule = 7;

  for (let offset = 0; offset < daysToSchedule; offset++) {
    // If done today, skip all notifications for today (offset 0)
    if (isDoneToday && offset === 0) continue;

    // 1. Contextual reminder notifications
    for (const slot of sunnah.notificationSchedule.reminderSlots) {
      let hour: number;
      let minute: number;

      if (prayerTimes && (slot === 'fajr' || slot === 'dhuhr' || slot === 'asr' || slot === 'maghrib' || slot === 'ishaa')) {
        hour = prayerTimes[slot].hour;
        minute = prayerTimes[slot].minute;
      } else {
        hour = REMINDER_SLOT_TIMES[slot].hour;
        minute = REMINDER_SLOT_TIMES[slot].minute;
      }
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);
      targetDate.setHours(hour, minute, 0, 0);

      // Only schedule if the time hasn't passed
      if (targetDate > now) {
        const message = pickRandom(sunnah.notificationMessages);
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_REMINDER}_${slot}_day${offset}`,
          content: {
            title: sunnah.action,
            body: message,
            data: { type: 'reminder', sunnahId: sunnah.id },
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
    if (sunnah.notificationSchedule.endOfDayCheckIn) {
      const checkInDate = new Date(now);
      checkInDate.setDate(now.getDate() + offset);
      checkInDate.setHours(endOfDayHour, endOfDayMinute, 0, 0);

      if (checkInDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_CHECKIN}_day${offset}`,
          content: {
            title: 'كيف كان يومك؟ 🌙',
            body: `هل التزمت اليوم بـ «${sunnah.action}»؟`,
            data: { type: 'checkin', sunnahId: sunnah.id },
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
    if (streakCount > 0) {
      const streakDate = new Date(now);
      streakDate.setDate(now.getDate() + offset);
      streakDate.setHours(endOfDayHour, endOfDayMinute - 30, 0, 0);

      if (streakDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX_STREAK}_day${offset}`,
          content: {
            title: `لا تكسر سلسلتك! ✨`,
            body: `أنت في اليوم ${streakCount + 1} من 7 لسنة «${sunnah.action}»`,
            data: { type: 'streak', sunnahId: sunnah.id },
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

export async function cancelSunnahNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter(n =>
      n.identifier.startsWith(PREFIX_REMINDER) ||
      n.identifier.startsWith(PREFIX_CHECKIN) ||
      n.identifier.startsWith(PREFIX_STREAK)
    );
    for (const notif of ours) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (e) {
    console.warn('Failed to cancel notifications', e);
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
