// ─── Sunnah Types ─────────────────────────────────────────────────────────────

export type SunnahDifficulty = "easy" | "medium" | "hard";

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

export interface SunnahGroup {
  id: string;
  title: string; // Arabic group title e.g. "أذكار ما بعد الصلاة"
  icon?: string;
  description?: string;
}

export interface Sunnah {
  id: string;
  title: string; // Arabic title name
  action: string;
  hadith: string; // supporting hadith text
  category: string;
  groupId?: string; // contextual bundle / group ID (e.g. "after_prayer", "eating_etiquette")
  difficulty: SunnahDifficulty;
  notificationSchedule: NotificationSchedule;
  notificationMessages: string[]; // rotated randomly for contextual reminders
  reward?: string;
  rewardSource: string | null;
  deprecated?: boolean; // never remove; mark deprecated to hide from rotation
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

export interface PersistedState {
  version?: number;
  currentSunnahId: string | null;
  streakDates: string[]; // ISO date strings 'YYYY-MM-DD'
  accomplishedIds: string[];
  skippedIds: string[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
}

export interface SunnahContextType {
  currentSunnah: Sunnah | null;
  streakDates: string[];
  streakCount: number;
  accomplishedSunnahs: Sunnah[];
  skippedSunnahs: Sunnah[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
  isLoading: boolean;
  hasMarkedToday: boolean;
  streakBrokenToday: boolean;
  markDoneToday: () => void;
  markAlreadyDoing: () => void;
  skipSunnah: () => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  prayerTimes: PrayerTimesResult | null;
  refreshPrayerTimes: () => Promise<void>;
  resetAllProgress: () => Promise<void>;
}
