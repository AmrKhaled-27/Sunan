import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { REMINDER_SLOT_TIMES } from '../constants/data';

export interface PrayerTimesResult {
  source: 'api' | 'cache' | 'fallback';
  fajr: { hour: number; minute: number };
  dhuhr: { hour: number; minute: number };
  asr: { hour: number; minute: number };
  maghrib: { hour: number; minute: number };
  ishaa: { hour: number; minute: number };
  fetchedAt: string | null;
}

const STORAGE_KEY = '@sonan_prayer_times';
const CACHE_TTL_HOURS = 24;

function parseTime(timeStr: string): { hour: number; minute: number } {
  // Expected format: "HH:mm"
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

export async function getPrayerTimes(forceRefresh = false): Promise<PrayerTimesResult> {
  try {
    if (!forceRefresh) {
      // 1. Check cache
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PrayerTimesResult;
        if (parsed.fetchedAt) {
          const fetchDate = new Date(parsed.fetchedAt);
          const now = new Date();
          const diffHours = (now.getTime() - fetchDate.getTime()) / (1000 * 60 * 60);
          
          if (diffHours < CACHE_TTL_HOURS) {
            return parsed;
          }
        }
      }
    }

    // 2. Request permission (will not prompt if already granted/denied previously)
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return getFallbackTimes();
    }

    // 3. Get location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest, // We only need city-level accuracy
    });
    
    const { latitude, longitude } = location.coords;

    // 4. Fetch Aladhan API
    // method 5 is Egyptian General Authority of Survey
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=5`
    );

    if (!response.ok) {
      throw new Error(`API fetch failed with status: ${response.status}`);
    }

    const json = await response.json();
    const timings = json.data.timings;

    const newTimes: PrayerTimesResult = {
      source: 'api',
      fajr: parseTime(timings.Fajr),
      dhuhr: parseTime(timings.Dhuhr),
      asr: parseTime(timings.Asr),
      maghrib: parseTime(timings.Maghrib),
      ishaa: parseTime(timings.Isha),
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTimes));

    return newTimes;
  } catch (error) {
    console.warn('Failed to get real prayer times, using fallback:', error);
    
    // Try to return stale cache if available
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PrayerTimesResult;
        return { ...parsed, source: 'cache' }; // mark as cache so we know it's stale
      }
    } catch (e) {
      // Ignore cache read errors
    }

    return getFallbackTimes();
  }
}

function getFallbackTimes(): PrayerTimesResult {
  return {
    source: 'fallback',
    fajr: REMINDER_SLOT_TIMES.fajr,
    dhuhr: REMINDER_SLOT_TIMES.dhuhr,
    asr: REMINDER_SLOT_TIMES.asr,
    maghrib: REMINDER_SLOT_TIMES.maghrib,
    ishaa: REMINDER_SLOT_TIMES.ishaa,
    fetchedAt: null,
  };
}

export async function getLocationPermissionStatus() {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}
