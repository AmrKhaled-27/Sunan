import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUNNAHS, Sunnah } from '../constants/data';

interface SunnahContextType {
  currentSunnah: Sunnah | null;
  streakCount: number;
  accomplishedSunnahs: Sunnah[];
  markDoneToday: () => void;
  markAlreadyDoing: () => void;
  skipSunnah: () => void;
  isLoading: boolean;
}

const SunnahContext = createContext<SunnahContextType | undefined>(undefined);

const STORAGE_KEY = '@sonan_state';

interface PersistedState {
  currentSunnahIndex: number;
  streakCount: number;
  accomplishedIds: string[];
}

export function SunnahProvider({ children }: { children: React.ReactNode }) {
  const [currentSunnahIndex, setCurrentSunnahIndex] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [accomplishedIds, setAccomplishedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PersistedState = JSON.parse(stored);
        setCurrentSunnahIndex(parsed.currentSunnahIndex);
        setStreakCount(parsed.streakCount);
        setAccomplishedIds(parsed.accomplishedIds);
      }
    } catch (e) {
      console.error('Failed to load state', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (state: PersistedState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  };

  const moveToNext = (newAccomplishedIds: string[]) => {
    // Basic logic to get next unaccomplished sunnah, or just next in array
    let nextIndex = currentSunnahIndex + 1;
    if (nextIndex >= SUNNAHS.length) {
      nextIndex = 0; // Wrap around for prototype
    }
    
    const newState = {
      currentSunnahIndex: nextIndex,
      streakCount: 0,
      accomplishedIds: newAccomplishedIds,
    };
    
    setCurrentSunnahIndex(nextIndex);
    setStreakCount(0);
    saveState(newState);
  };

  const markDoneToday = () => {
    const newStreak = streakCount + 1;
    if (newStreak >= 7) {
      // Completed 7 days
      const currentId = SUNNAHS[currentSunnahIndex].id;
      const newAccomplishedIds = [...accomplishedIds, currentId];
      setAccomplishedIds(newAccomplishedIds);
      moveToNext(newAccomplishedIds);
    } else {
      setStreakCount(newStreak);
      saveState({ currentSunnahIndex, streakCount: newStreak, accomplishedIds });
    }
  };

  const markAlreadyDoing = () => {
    const currentId = SUNNAHS[currentSunnahIndex].id;
    const newAccomplishedIds = [...accomplishedIds, currentId];
    setAccomplishedIds(newAccomplishedIds);
    moveToNext(newAccomplishedIds);
  };

  const skipSunnah = () => {
    moveToNext(accomplishedIds);
  };

  const currentSunnah = SUNNAHS[currentSunnahIndex] || null;
  const accomplishedSunnahs = SUNNAHS.filter(s => accomplishedIds.includes(s.id));

  return (
    <SunnahContext.Provider
      value={{
        currentSunnah,
        streakCount,
        accomplishedSunnahs,
        markDoneToday,
        markAlreadyDoing,
        skipSunnah,
        isLoading,
      }}
    >
      {children}
    </SunnahContext.Provider>
  );
}

export function useSunnah() {
  const context = useContext(SunnahContext);
  if (context === undefined) {
    throw new Error('useSunnah must be used within a SunnahProvider');
  }
  return context;
}
