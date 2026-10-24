import { Routine } from "@/types";

// Array/member order is learning order, not a prescribed religious sequence.
// Schedules combine the original member reminder slots without duplicates.
export const ROUTINES: Routine[] = [
  {
    id: "after_prayer_core", title: "أذكار ما بعد الصلاة", sunnahIds: ["1", "3", "4", "2"],
    notificationSchedule: { reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين أذكار ما بعد الصلاة، راجع أعماله وواصل المداومة عليها"],
  },
  {
    id: "after_prayer_recitation", title: "القراءة والدعاء بعد الصلاة", sunnahIds: ["5", "6", "7"],
    notificationSchedule: { reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين القراءة والدعاء بعد الصلاة"],
  },
  {
    id: "adhan", title: "سنن الأذان", sunnahIds: ["14", "15"],
    notificationSchedule: { reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بسنن الأذان: راجع أعمال الروتين وواصل المداومة عليها"],
  },
  {
    id: "eating", title: "سنن الطعام", sunnahIds: ["16", "17"],
    notificationSchedule: { reminderSlots: ["morning", "afternoon", "maghrib"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين سنن الطعام"],
  },
  {
    id: "toilet", title: "آداب الخلاء", sunnahIds: ["8", "9"],
    notificationSchedule: { reminderSlots: ["fajr", "morning", "dhuhr", "asr", "maghrib", "ishaa", "before_sleep"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين آداب الخلاء، راجع أعماله في التطبيق"],
  },
  {
    id: "sleep_prep", title: "الاستعداد للنوم", sunnahIds: ["18", "10", "11", "24"],
    notificationSchedule: { reminderSlots: ["ishaa", "before_sleep"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين الاستعداد للنوم"],
  },
  {
    id: "sleep_recitation", title: "القراءة قبل النوم", sunnahIds: ["19", "12", "20", "22"],
    notificationSchedule: { reminderSlots: ["ishaa", "before_sleep"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين القراءة قبل النوم"],
  },
  {
    id: "sleep_dhikr", title: "أذكار النوم", sunnahIds: ["13", "23", "25", "26"],
    notificationSchedule: { reminderSlots: ["ishaa", "before_sleep"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين أذكار النوم"],
  },
  {
    id: "sajda_mulk", title: "قراءة السجدة والملك", sunnahIds: ["21"],
    notificationSchedule: { reminderSlots: ["ishaa", "before_sleep"], endOfDayCheckIn: true },
    notificationMessages: ["تذكير بروتين قراءة السجدة والملك"],
  },
];
