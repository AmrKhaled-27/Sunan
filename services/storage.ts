import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUNNAHS } from "@/constants/data";
import { PersistedState, UserSettings } from "@/types";
import { daysBetween, todayStr } from "@/utils/date";
import { nextSunnahId } from "@/utils/sunnah";

const STORAGE_KEY = "@sonan_state_v2";

export const DEFAULT_SETTINGS: UserSettings = {
  endOfDayHour: 21,
  endOfDayMinute: 0,
  notificationsEnabled: true,
};

export const INITIAL_PERSISTED_STATE: PersistedState = {
  version: 2,
  currentSunnahId: null,
  streakDates: [],
  accomplishedIds: [],
  skippedIds: [],
  settings: DEFAULT_SETTINGS,
  totalCompleted: 0,
  longestStreak: 0,
};

export interface LoadedStateResult {
  state: PersistedState;
  streakBroken: boolean;
}

/** Load state from AsyncStorage with streak and ID validation */
export async function loadPersistedState(): Promise<LoadedStateResult> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialId = nextSunnahId(null, [], []);
      return {
        state: {
          ...INITIAL_PERSISTED_STATE,
          currentSunnahId: initialId,
        },
        streakBroken: false,
      };
    }

    const p: PersistedState = JSON.parse(stored);
    const today = todayStr();

    // Validate streak continuity on load
    let validStreak = p.streakDates ?? [];
    let broken = false;
    if (validStreak.length > 0) {
      const lastDate = validStreak[validStreak.length - 1];
      const gap = daysBetween(lastDate, today);
      if (gap >= 2) {
        validStreak = [];
        broken = true;
      }
    }

    const accomplished = p.accomplishedIds ?? [];
    const skipped = p.skippedIds ?? [];
    let resolvedId = p.currentSunnahId ?? null;

    // If saved ID is already accomplished, non-existent, or empty, find next valid ID
    if (
      !resolvedId ||
      accomplished.includes(resolvedId) ||
      !SUNNAHS.some((s) => s.id === resolvedId)
    ) {
      resolvedId = nextSunnahId(resolvedId, accomplished, skipped);
    }

    const loadedState: PersistedState = {
      version: 2,
      currentSunnahId: resolvedId,
      streakDates: validStreak,
      accomplishedIds: accomplished,
      skippedIds: skipped,
      settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
      totalCompleted: p.totalCompleted ?? 0,
      longestStreak: p.longestStreak ?? 0,
    };

    if (broken) {
      await savePersistedState(loadedState);
    }

    return {
      state: loadedState,
      streakBroken: broken,
    };
  } catch (error) {
    console.error("Failed to load persisted state", error);
    const initialId = nextSunnahId(null, [], []);
    return {
      state: {
        ...INITIAL_PERSISTED_STATE,
        currentSunnahId: initialId,
      },
      streakBroken: false,
    };
  }
}

/** Save state to AsyncStorage */
export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save persisted state", error);
  }
}

/** Clear all persisted state */
export async function clearPersistedState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear persisted state", error);
  }
}
