import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistedState } from "@/types";
import { freshState, recoverState } from "@/utils/routineState";
export { DEFAULT_SETTINGS } from "@/utils/routineState";

export const STORAGE_KEY = "@sonan_state_v3";
export const INITIAL_PERSISTED_STATE = freshState();
let pendingWrite = Promise.resolve();

export async function loadPersistedState() {
  let result: ReturnType<typeof recoverState>;
  try {
    // A failed earlier write must not prevent reading the last valid save.
    await pendingWrite.catch(() => {});
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    result = recoverState(stored ? JSON.parse(stored) : null);
  } catch (error) {
    console.error("Failed to load persisted state", error);
    return { state: freshState(), streakBroken: false };
  }
  try {
    await savePersistedState(result.state);
  } catch (error) {
    // Keep successfully loaded progress in memory if storage is temporarily full
    // or unavailable; a later successful action can persist it again.
    console.error("Failed to save recovered state", error);
  }
  return result;
}

export function savePersistedState(state: PersistedState): Promise<void> {
  const serialized = JSON.stringify(state);
  pendingWrite = pendingWrite
    .catch(() => {})
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized));
  return pendingWrite;
}

export function clearPersistedState(): Promise<void> {
  pendingWrite = pendingWrite
    .catch(() => {})
    .then(() => AsyncStorage.removeItem(STORAGE_KEY));
  return pendingWrite;
}
