// ─── Sunnah Types ─────────────────────────────────────────────────────────────

export type HadithGrading = "sahih" | "hasan" | "daif";

// Each reminder time maps to an hour (24h) that we schedule the notification
export type ReminderSlot =
  | "fajr" // Fajr prayer time
  | "morning" // Dynamic: Fajr + 2.5 hours
  | "dhuhr" // Dhuhr prayer time
  | "asr" // Asr prayer time
  | "afternoon" // ~15:30
  | "maghrib" // Maghrib prayer time
  | "ishaa" // Ishaa prayer time
  | "before_sleep"; // default 22:00 (10:00 PM)

export interface NotificationSchedule {
  reminderSlots: ReminderSlot[]; // contextual reminder times
  endOfDayCheckIn: boolean; // whether to send end-of-day "did you do it?" question
}

export interface HadithEvidence {
  id?: string;
  text: string; // نص الحديث الشريف كاملاً متضمناً الصحابي الراوي
  source: string; // التخريج والمصدر (مثلاً: رواه مسلم ٣٨٥)
  grading: HadithGrading; // درجة الحديث
}

export interface Sunnah {
  id: string;
  title: string; // Arabic title name
  action: string;
  hadiths: HadithEvidence[]; // supporting hadiths & sources array
  reward?: string;
  deprecated?: boolean; // never remove; mark deprecated to hide from rotation
}

export interface Routine {
  id: string;
  title: string;
  icon?: string;
  intro?: string;
  sunnahIds: string[];
  notificationSchedule: NotificationSchedule;
  notificationMessages: string[];
  deprecated?: boolean;
  streakDays?: 7;
}

// ─── Prayer Times Types ───────────────────────────────────────────────────────

export interface PrayerTimesResult {
  source: "calc" | "api" | "cache" | "fallback";
  fajr: { hour: number; minute: number };
  dhuhr: { hour: number; minute: number };
  asr: { hour: number; minute: number };
  maghrib: { hour: number; minute: number };
  ishaa: { hour: number; minute: number };
  fetchedAt: string | null;
  latitude?: number;
  longitude?: number;
}

// ─── Settings & State Types ───────────────────────────────────────────────────

export interface UserSettings {
  endOfDayHour: number;
  endOfDayMinute: number;
  notificationsEnabled: boolean;
}

export type AccomplishedMethod = "streak" | "already_doing";

export interface AccomplishedRecord {
  id: string;
  routineId?: string;
  completedAt: string | null; // ISO date 'YYYY-MM-DD'; null for older saves
  method: AccomplishedMethod | null;
}

export interface PersistedState {
  version: 3;
  currentRoutineId: string | null;
  streakDates: string[]; // ISO date strings 'YYYY-MM-DD'
  accomplishedIds: string[];
  accomplishedRecords?: AccomplishedRecord[];
  skippedRoutineIds: string[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
}

export interface SunnahContextType {
  currentRoutine: Routine | null;
  remainingMembers: Sunnah[];
  streakDates: string[];
  streakCount: number;
  accomplishedSunnahs: Sunnah[];
  accomplishedRecords: AccomplishedRecord[];
  skippedRoutines: Routine[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
  isLoading: boolean;
  hasMarkedToday: boolean;
  streakBrokenToday: boolean;
  markDoneToday: () => Routine | null;
  markAlreadyDoing: () => void;
  postponeRoutine: () => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  prayerTimes: PrayerTimesResult | null;
  refreshPrayerTimes: () => Promise<void>;
  resetAllProgress: () => Promise<void>;
}
