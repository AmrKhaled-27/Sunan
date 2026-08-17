// ─── Sunnah Types ─────────────────────────────────────────────────────────────

export type SunnahDifficulty = "easy" | "medium" | "hard";

// Each reminder time maps to an hour (24h) that we schedule the notification
export type ReminderSlot =
  | "fajr" // ~5:00
  | "morning" // ~8:00
  | "dhuhr" // ~12:30
  | "asr" // ~15:30
  | "afternoon" // ~15:30
  | "maghrib" // ~18:30
  | "ishaa" // ~20:00
  | "evening" // ~20:00
  | "before_sleep"; // user-configurable, default 21:30

export interface NotificationSchedule {
  reminderSlots: ReminderSlot[]; // contextual reminder times
  endOfDayCheckIn: boolean; // whether to send end-of-day "did you do it?" question
}

export interface Sunnah {
  id: string;
  title: string; // Arabic title name
  action: string;
  hadith: string; // supporting hadith text
  category: string;
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
