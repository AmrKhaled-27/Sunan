import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SUNNAHS } from "@/constants/data";
import {
  cancelAllNotifications,
  requestPermissions,
  scheduleSunnahNotifications,
  setupAndroidChannels,
} from "@/services/notifications";
import { getPrayerTimes } from "@/services/prayerTimes";
import {
  clearPersistedState,
  DEFAULT_SETTINGS,
  INITIAL_PERSISTED_STATE,
  loadPersistedState,
  savePersistedState,
} from "@/services/storage";
import {
  AccomplishedRecord,
  PrayerTimesResult,
  SunnahContextType,
  UserSettings,
} from "@/types";
import { todayStr } from "@/utils/date";
import { appendStreakDate } from "@/utils/streak";
import { nextSunnahId } from "@/utils/sunnah";

export type { UserSettings, SunnahContextType };

const SunnahContext = createContext<SunnahContextType | undefined>(undefined);

export function SunnahProvider({ children }: { children: React.ReactNode }) {
  const [currentSunnahId, setCurrentSunnahId] = useState<string | null>(null);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [accomplishedIds, setAccomplishedIds] = useState<string[]>([]);
  const [accomplishedRecords, setAccomplishedRecords] = useState<
    AccomplishedRecord[]
  >([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [streakBrokenToday, setStreakBrokenToday] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResult | null>(null);

  // Keep a ref to the latest state for atomic persistence without stale closure issues
  const stateRef = useRef({
    currentSunnahId,
    streakDates,
    accomplishedIds,
    accomplishedRecords,
    skippedIds,
    settings,
    totalCompleted,
    longestStreak,
  });

  stateRef.current = {
    currentSunnahId,
    streakDates,
    accomplishedIds,
    accomplishedRecords,
    skippedIds,
    settings,
    totalCompleted,
    longestStreak,
  };

  // ── Initialise ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await setupAndroidChannels();
      await initLoadState();
      await fetchPrayerTimes();
    })();
  }, []);

  const fetchPrayerTimes = async (force = false) => {
    try {
      const times = await getPrayerTimes(force);
      setPrayerTimes(times);
    } catch (e) {
      console.warn("Failed to fetch prayer times in context", e);
    }
  };

  const initLoadState = async () => {
    try {
      const { state, streakBroken } = await loadPersistedState();
      setCurrentSunnahId(state.currentSunnahId);
      setStreakDates(state.streakDates);
      setAccomplishedIds(state.accomplishedIds);
      setAccomplishedRecords(state.accomplishedRecords ?? []);
      setSkippedIds(state.skippedIds);
      setSettings(state.settings);
      setTotalCompleted(state.totalCompleted);
      setLongestStreak(state.longestStreak);
      setStreakBrokenToday(streakBroken);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Re-schedule notifications whenever sunnah or settings change ───────────
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const today = todayStr();
  const hasMarkedToday = streakDates.includes(today);
  const streakCount = streakDates.length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const markDoneToday = useCallback(() => {
    if (hasMarkedToday || !currentSunnahId) return;

    const newStreakDates = appendStreakDate(streakDates);
    const newStreak = newStreakDates.length;
    const newLongest = Math.max(longestStreak, newStreak);

    if (newStreak >= 7) {
      // Completed 7-day streak
      const newAccomplished = [...accomplishedIds, currentSunnahId];
      const newRecords: AccomplishedRecord[] = [
        ...accomplishedRecords,
        {
          id: currentSunnahId,
          completedAt: todayStr(),
          method: "streak",
        },
      ];
      const newTotal = totalCompleted + 1;
      const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);

      setAccomplishedIds(newAccomplished);
      setAccomplishedRecords(newRecords);
      setTotalCompleted(newTotal);
      setLongestStreak(newLongest);
      setCurrentSunnahId(newId);
      setStreakDates([]);

      savePersistedState({
        ...stateRef.current,
        currentSunnahId: newId,
        streakDates: [],
        accomplishedIds: newAccomplished,
        accomplishedRecords: newRecords,
        totalCompleted: newTotal,
        longestStreak: newLongest,
      });
    } else {
      setStreakDates(newStreakDates);
      setLongestStreak(newLongest);

      savePersistedState({
        ...stateRef.current,
        streakDates: newStreakDates,
        longestStreak: newLongest,
      });
    }
  }, [
    hasMarkedToday,
    currentSunnahId,
    streakDates,
    longestStreak,
    accomplishedIds,
    accomplishedRecords,
    skippedIds,
    totalCompleted,
  ]);

  const markAlreadyDoing = useCallback(() => {
    if (!currentSunnahId) return;
    const newAccomplished = [...accomplishedIds, currentSunnahId];
    const newRecords: AccomplishedRecord[] = [
      ...accomplishedRecords,
      {
        id: currentSunnahId,
        completedAt: todayStr(),
        method: "already_doing",
      },
    ];
    const newTotal = totalCompleted + 1;
    const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);

    setAccomplishedIds(newAccomplished);
    setAccomplishedRecords(newRecords);
    setTotalCompleted(newTotal);
    setCurrentSunnahId(newId);
    setStreakDates([]);

    savePersistedState({
      ...stateRef.current,
      currentSunnahId: newId,
      streakDates: [],
      accomplishedIds: newAccomplished,
      accomplishedRecords: newRecords,
      totalCompleted: newTotal,
    });
  }, [currentSunnahId, accomplishedIds, accomplishedRecords, skippedIds, totalCompleted]);

  const skipSunnah = useCallback(() => {
    if (!currentSunnahId) return;
    const newSkipped = skippedIds.includes(currentSunnahId)
      ? skippedIds
      : [...skippedIds, currentSunnahId];
    const newId = nextSunnahId(currentSunnahId, accomplishedIds, newSkipped);

    setSkippedIds(newSkipped);
    setCurrentSunnahId(newId);
    setStreakDates([]);

    savePersistedState({
      ...stateRef.current,
      currentSunnahId: newId,
      streakDates: [],
      skippedIds: newSkipped,
    });
  }, [currentSunnahId, accomplishedIds, skippedIds]);

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

  const refreshPrayerTimes = useCallback(async () => {
    await fetchPrayerTimes(true);
  }, []);

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

  // ── Derived collections ────────────────────────────────────────────────────
  const currentSunnah =
    currentSunnahId && !accomplishedIds.includes(currentSunnahId)
      ? SUNNAHS.find((s) => s.id === currentSunnahId) ?? null
      : null;
  const accomplishedSunnahs = accomplishedIds
    .map((id) => SUNNAHS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const skippedSunnahs = SUNNAHS.filter((s) => skippedIds.includes(s.id));

  return (
    <SunnahContext.Provider
      value={{
        currentSunnah,
        streakDates,
        streakCount,
        accomplishedSunnahs,
        accomplishedRecords,
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
  if (!context) {
    throw new Error("useSunnah must be used within a SunnahProvider");
  }
  return context;
}
