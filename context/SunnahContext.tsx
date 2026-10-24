import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { SUNNAHS } from "@/constants/sunnahs";
import { ROUTINES } from "@/constants/routines";
import {
  cancelAllNotifications,
  scheduleRoutineNotifications,
  setupAndroidChannels,
} from "@/services/notifications";
import { getPrayerTimes } from "@/services/prayerTimes";
import { loadPersistedState, savePersistedState } from "@/services/storage";
import {
  PersistedState,
  PrayerTimesResult,
  SunnahContextType,
  UserSettings,
} from "@/types";
import { todayStr } from "@/utils/date";
import { watchLocalDay } from "@/utils/dayBoundary";
import { remainingMembers as selectRemaining } from "@/utils/routine";
import {
  freshState,
  recoverState,
  RoutineAction,
  transitionRoutine,
} from "@/utils/routineState";

export type { UserSettings, SunnahContextType };
const SunnahContext = createContext<SunnahContextType | undefined>(undefined);

export function SunnahProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(freshState);
  const stateRef = useRef(state);
  const [isLoading, setIsLoading] = useState(true);
  const [streakBrokenToday, setStreakBrokenToday] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResult | null>(
    null,
  );

  const commit = useCallback((next: PersistedState) => {
    stateRef.current = next;
    setState(next);
    void savePersistedState(next).catch((error) =>
      console.error("Failed to save progress", error),
    );
  }, []);

  const refreshPrayerTimes = useCallback(async () => {
    try {
      setPrayerTimes(await getPrayerTimes(true));
    } catch (error) {
      console.warn("Failed to fetch prayer times", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await cancelAllNotifications();
        await setupAndroidChannels();
      } catch (error) {
        console.warn("Failed to set up notification channels", error);
      }
      const loaded = await loadPersistedState();
      if (!mounted) return;
      stateRef.current = loaded.state;
      setState(loaded.state);
      setStreakBrokenToday(loaded.streakBroken);
      setIsLoading(false);
      try {
        const times = await getPrayerTimes();
        if (mounted) setPrayerTimes(times);
      } catch (error) {
        console.warn("Failed to fetch prayer times", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const refreshDay = () => {
      const recovered = recoverState(stateRef.current);
      setStreakBrokenToday(recovered.streakBroken);
      commit(recovered.state);
    };
    const stopWatchingDay = watchLocalDay(refreshDay);
    const subscription = AppState.addEventListener("change", (status) => {
      if (status !== "active") return;
      refreshDay();
    });
    return () => {
      subscription.remove();
      stopWatchingDay();
    };
  }, [isLoading, commit]);

  const currentRoutine =
    ROUTINES.find((r) => r.id === state.currentRoutineId) ?? null;
  useEffect(() => {
    if (isLoading) return;
    void scheduleRoutineNotifications(
      currentRoutine,
      state.settings.endOfDayHour,
      state.settings.endOfDayMinute,
      state.streakDates.length,
      state.streakDates.includes(todayStr()),
      prayerTimes,
      state.settings.notificationsEnabled,
    ).catch((error) =>
      console.warn("Failed to reschedule routine notifications", error),
    );
  }, [
    currentRoutine,
    state.settings,
    state.streakDates,
    isLoading,
    prayerTimes,
  ]);

  const act = (action: RoutineAction) => {
    if (isLoading) return null;
    const next = transitionRoutine(stateRef.current, action, state);
    if (next !== stateRef.current) {
      const completed =
        action === "mark" &&
        next.totalCompleted > stateRef.current.totalCompleted
          ? currentRoutine
          : null;
      commit(next);
      setStreakBrokenToday(false);
      return completed;
    }
    return null;
  };

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      const current = stateRef.current;
      commit({ ...current, settings: { ...current.settings, ...partial } });
    },
    [commit],
  );

  const resetAllProgress = useCallback(async () => {
    const next = freshState();
    commit(next);
    setStreakBrokenToday(false);
    await Promise.all([savePersistedState(next), cancelAllNotifications()]);
  }, [commit]);

  return (
    <SunnahContext.Provider
      value={{
        currentRoutine,
        remainingMembers: currentRoutine
          ? selectRemaining(currentRoutine, state.accomplishedIds)
          : [],
        streakDates: state.streakDates,
        streakCount: state.streakDates.length,
        accomplishedSunnahs: state.accomplishedIds
          .map((id) => SUNNAHS.find((s) => s.id === id)!)
          .filter(Boolean),
        accomplishedRecords: state.accomplishedRecords ?? [],
        skippedRoutines: ROUTINES.filter((r) =>
          state.skippedRoutineIds.includes(r.id),
        ),
        settings: state.settings,
        totalCompleted: state.totalCompleted,
        longestStreak: state.longestStreak,
        isLoading,
        hasMarkedToday: state.streakDates.includes(todayStr()),
        streakBrokenToday,
        markDoneToday: () => act("mark"),
        markAlreadyDoing: () => act("already_doing"),
        postponeRoutine: () => act("postpone"),
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
  if (!context)
    throw new Error("useSunnah must be used within a SunnahProvider");
  return context;
}
