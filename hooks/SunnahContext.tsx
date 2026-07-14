import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUNNAHS, Sunnah } from '../constants/data';
import {
  setupAndroidChannels,
  requestPermissions,
  scheduleSunnahNotifications,
  cancelSunnahNotifications,
  cancelAllNotifications,
} from '../services/notifications';
import { getPrayerTimes, PrayerTimesResult } from '../services/prayerTimes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSettings {
  endOfDayHour: number;
  endOfDayMinute: number;
  notificationsEnabled: boolean;
}

interface PersistedState {
  currentSunnahId: string;
  streakDates: string[];          // ISO date strings 'YYYY-MM-DD'
  accomplishedIds: string[];
  skippedIds: string[];
  settings: UserSettings;
  totalCompleted: number;
  longestStreak: number;
  startDate: string;
}

interface SunnahContextType {
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

/** Find the next available sunnah ID that is not accomplished or skipped */
function nextSunnahId(
  currentId: string,
  accomplishedIds: string[],
  skippedIds: string[]
): string {
  const activeSunnahs = SUNNAHS.filter(
    s => !s.deprecated && !accomplishedIds.includes(s.id)
  );
  if (activeSunnahs.length === 0) return SUNNAHS[0].id; // fallback: wrap

  const currentIdx = activeSunnahs.findIndex(s => s.id === currentId);
  const nextIdx    = (currentIdx + 1) % activeSunnahs.length;
  return activeSunnahs[nextIdx].id;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  endOfDayHour: 21,
  endOfDayMinute: 0,
  notificationsEnabled: true,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SunnahContext = createContext<SunnahContextType | undefined>(undefined);
const STORAGE_KEY = '@sonan_state_v2';

export function SunnahProvider({ children }: { children: React.ReactNode }) {
  const [currentSunnahId, setCurrentSunnahId] = useState<string>(SUNNAHS[0].id);
  const [streakDates,     setStreakDates]     = useState<string[]>([]);
  const [accomplishedIds, setAccomplishedIds] = useState<string[]>([]);
  const [skippedIds,      setSkippedIds]      = useState<string[]>([]);
  const [settings,        setSettings]        = useState<UserSettings>(DEFAULT_SETTINGS);
  const [totalCompleted,  setTotalCompleted]  = useState(0);
  const [longestStreak,   setLongestStreak]   = useState(0);
  const [isLoading,       setIsLoading]       = useState(true);
  const [streakBrokenToday, setStreakBrokenToday] = useState(false);
  const [prayerTimes,     setPrayerTimes]     = useState<PrayerTimesResult | null>(null);

  // ── Initialise ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await setupAndroidChannels();
      await loadState();
      await fetchPrayerTimes();
    })();
  }, []);

  const fetchPrayerTimes = async (force = false) => {
    try {
      const times = await getPrayerTimes(force);
      setPrayerTimes(times);
    } catch (e) {
      console.warn('Failed to fetch prayer times in context', e);
    }
  };

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const p: PersistedState = JSON.parse(stored);
        const today = todayStr();

        // Validate streak continuity on load
        let validStreak = p.streakDates ?? [];
        let broken = false;
        if (validStreak.length > 0) {
          const lastDate = validStreak[validStreak.length - 1];
          const gap = daysBetween(lastDate, today);
          if (gap >= 2) {
            // Streak broken — reset
            validStreak = [];
            broken = true;
          }
        }

        setCurrentSunnahId(p.currentSunnahId ?? SUNNAHS[0].id);
        setStreakDates(validStreak);
        setAccomplishedIds(p.accomplishedIds ?? []);
        setSkippedIds(p.skippedIds ?? []);
        setSettings({ ...DEFAULT_SETTINGS, ...(p.settings ?? {}) });
        setTotalCompleted(p.totalCompleted ?? 0);
        setLongestStreak(p.longestStreak ?? 0);
        setStreakBrokenToday(broken);

        // If streak was broken save the reset state
        if (broken) {
          await saveState({
            ...p,
            streakDates: [],
          });
        }
      }
    } catch (e) {
      console.error('Failed to load state', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (override?: Partial<PersistedState>) => {
    const state: PersistedState = {
      currentSunnahId,
      streakDates,
      accomplishedIds,
      skippedIds,
      settings,
      totalCompleted,
      longestStreak,
      startDate: todayStr(),
      ...override,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // ── Re-schedule notifications whenever sunnah or settings change ─────────────
  useEffect(() => {
    if (isLoading) return;
    const sunnah = SUNNAHS.find(s => s.id === currentSunnahId);
    if (!sunnah) return;
    
    const today = todayStr();
    const hasMarkedToday = streakDates.includes(today);

    if (settings.notificationsEnabled) {
      (async () => {
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          scheduleSunnahNotifications(
            sunnah,
            settings.endOfDayHour,
            settings.endOfDayMinute,
            streakDates.length,
            hasMarkedToday,
            prayerTimes
          );
        }
      })();
    } else {
      cancelAllNotifications();
    }
  }, [currentSunnahId, settings, streakDates, isLoading, prayerTimes]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const today = todayStr();
  const hasMarkedToday = streakDates.includes(today);
  const streakCount = streakDates.length;

  // ── Actions ──────────────────────────────────────────────────────────────────

  const markDoneToday = useCallback(() => {
    if (hasMarkedToday) return; // already marked

    const today = todayStr();
    let newStreakDates = [...streakDates];

    if (newStreakDates.length > 0) {
      const lastDate = newStreakDates[newStreakDates.length - 1];
      const gap = daysBetween(lastDate, today);
      if (gap >= 2) {
        // gap detected — streak reset (shouldn't normally happen here since loadState handles it)
        newStreakDates = [today];
      } else {
        newStreakDates = [...newStreakDates, today];
      }
    } else {
      newStreakDates = [today];
    }

    const newStreak = newStreakDates.length;
    const newLongest = Math.max(longestStreak, newStreak);

    if (newStreak >= 7) {
      // 🎉 Sunnah completed!
      const newAccomplished = [...accomplishedIds, currentSunnahId];
      const newTotal = totalCompleted + 1;
      const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);

      setAccomplishedIds(newAccomplished);
      setTotalCompleted(newTotal);
      setLongestStreak(newLongest);
      setCurrentSunnahId(newId);
      setStreakDates([]);

      saveState({
        currentSunnahId: newId,
        streakDates: [],
        accomplishedIds: newAccomplished,
        skippedIds,
        totalCompleted: newTotal,
        longestStreak: newLongest,
      });
    } else {
      setStreakDates(newStreakDates);
      setLongestStreak(newLongest);

      saveState({
        currentSunnahId,
        streakDates: newStreakDates,
        accomplishedIds,
        skippedIds,
        longestStreak: newLongest,
      });
    }
  }, [
    hasMarkedToday, streakDates, longestStreak, currentSunnahId,
    accomplishedIds, skippedIds, totalCompleted,
  ]);

  const markAlreadyDoing = useCallback(() => {
    const newAccomplished = [...accomplishedIds, currentSunnahId];
    const newTotal = totalCompleted + 1;
    const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);

    setAccomplishedIds(newAccomplished);
    setTotalCompleted(newTotal);
    setCurrentSunnahId(newId);
    setStreakDates([]);

    saveState({
      currentSunnahId: newId,
      streakDates: [],
      accomplishedIds: newAccomplished,
      skippedIds,
      totalCompleted: newTotal,
    });
  }, [currentSunnahId, accomplishedIds, skippedIds, totalCompleted]);

  const skipSunnah = useCallback(() => {
    const newSkipped = [...skippedIds, currentSunnahId];
    const newId = nextSunnahId(currentSunnahId, accomplishedIds, newSkipped);

    setSkippedIds(newSkipped);
    setCurrentSunnahId(newId);
    setStreakDates([]);

    saveState({
      currentSunnahId: newId,
      streakDates: [],
      accomplishedIds,
      skippedIds: newSkipped,
    });
  }, [currentSunnahId, accomplishedIds, skippedIds]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveState({ settings: next });
      return next;
    });
  }, []);

  // ── Derived collections ──────────────────────────────────────────────────────
  const currentSunnah    = SUNNAHS.find(s => s.id === currentSunnahId) ?? null;
  const accomplishedSunnahs = SUNNAHS.filter(s => accomplishedIds.includes(s.id));
  const skippedSunnahs   = SUNNAHS.filter(s => skippedIds.includes(s.id));

  const refreshPrayerTimes = useCallback(async () => {
    await fetchPrayerTimes(true);
  }, []);

  return (
    <SunnahContext.Provider
      value={{
        currentSunnah,
        streakDates,
        streakCount,
        accomplishedSunnahs,
        skippedSunnahs,
        settings,
        totalCompleted,
        longestStreak,
        isLoading,
        hasMarkedToday,
        streakBrokenToday,
        markDoneToday,
        markAlreadyDoing,
        skipSunnah,
        updateSettings,
        prayerTimes,
        refreshPrayerTimes,
      }}
    >
      {children}
    </SunnahContext.Provider>
  );
}

export function useSunnah() {
  const context = useContext(SunnahContext);
  if (!context) throw new Error('useSunnah must be used within a SunnahProvider');
  return context;
}
