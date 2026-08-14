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
  currentSunnahId: string | null;
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
  resetAllProgress: () => Promise<void>;
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
  currentId: string | null,
  accomplishedIds: string[],
  skippedIds: string[]
): string | null {
  // 1. First priority: Active Sunnahs that are neither accomplished nor skipped
  const unhandledSunnahs = SUNNAHS.filter(
    s => !s.deprecated && !accomplishedIds.includes(s.id) && !skippedIds.includes(s.id)
  );

  if (unhandledSunnahs.length > 0) {
    const currentIdx = currentId ? unhandledSunnahs.findIndex(s => s.id === currentId) : -1;
    if (currentIdx === -1) {
      return unhandledSunnahs[0].id;
    }
    const nextIdx = (currentIdx + 1) % unhandledSunnahs.length;
    return unhandledSunnahs[nextIdx].id;
  }

  // 2. Second priority: If all unhandled are done/skipped, cycle through remaining unaccomplished skipped ones
  const remainingUnaccomplished = SUNNAHS.filter(
    s => !s.deprecated && !accomplishedIds.includes(s.id)
  );

  if (remainingUnaccomplished.length > 0) {
    const currentIdx = currentId ? remainingUnaccomplished.findIndex(s => s.id === currentId) : -1;
    if (currentIdx === -1) {
      return remainingUnaccomplished[0].id;
    }
    const nextIdx = (currentIdx + 1) % remainingUnaccomplished.length;
    return remainingUnaccomplished[nextIdx].id;
  }

  // 3. All sunnahs are accomplished!
  return null;
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
  const [currentSunnahId, setCurrentSunnahId] = useState<string | null>(null);
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

        const accomplished = p.accomplishedIds ?? [];
        const skipped = p.skippedIds ?? [];
        let resolvedId = p.currentSunnahId ?? null;

        // If saved ID is already accomplished, non-existent, or empty, find next valid ID
        if (!resolvedId || accomplished.includes(resolvedId) || !SUNNAHS.some(s => s.id === resolvedId)) {
          resolvedId = nextSunnahId(resolvedId, accomplished, skipped);
        }

        setCurrentSunnahId(resolvedId);
        setStreakDates(validStreak);
        setAccomplishedIds(accomplished);
        setSkippedIds(skipped);
        setSettings({ ...DEFAULT_SETTINGS, ...(p.settings ?? {}) });
        setTotalCompleted(p.totalCompleted ?? 0);
        setLongestStreak(p.longestStreak ?? 0);
        setStreakBrokenToday(broken);

        // If streak was broken save the reset state
        if (broken) {
          await saveState({
            ...p,
            currentSunnahId: resolvedId,
            streakDates: [],
          });
        }
      } else {
        const initialId = nextSunnahId(null, [], []);
        setCurrentSunnahId(initialId);
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
    if (!currentSunnahId) {
      cancelAllNotifications();
      return;
    }
    const sunnah = SUNNAHS.find(s => s.id === currentSunnahId);
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
    if (hasMarkedToday || !currentSunnahId) return; // already marked or no active sunnah

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
    if (!currentSunnahId) return;
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
    if (!currentSunnahId) return;
    const newSkipped = skippedIds.includes(currentSunnahId)
      ? skippedIds
      : [...skippedIds, currentSunnahId];
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
  const currentSunnah = currentSunnahId && !accomplishedIds.includes(currentSunnahId)
    ? SUNNAHS.find(s => s.id === currentSunnahId) ?? null
    : null;
  const accomplishedSunnahs = SUNNAHS.filter(s => accomplishedIds.includes(s.id));
  const skippedSunnahs   = SUNNAHS.filter(s => skippedIds.includes(s.id));

  const refreshPrayerTimes = useCallback(async () => {
    await fetchPrayerTimes(true);
  }, []);

  const resetAllProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const initialId = nextSunnahId(null, [], []);
      setCurrentSunnahId(initialId);
      setStreakDates([]);
      setAccomplishedIds([]);
      setSkippedIds([]);
      setSettings(DEFAULT_SETTINGS);
      setTotalCompleted(0);
      setLongestStreak(0);
      setStreakBrokenToday(false);
    } catch (e) {
      console.error('Failed to reset progress', e);
    }
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
        resetAllProgress,
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
