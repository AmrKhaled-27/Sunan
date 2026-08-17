import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import * as Location from "expo-location";
import { REMINDER_SLOT_TIMES } from "@/constants/data";
import { PrayerTimesResult } from "@/types";

export type { PrayerTimesResult };

const COORDS_STORAGE_KEY = "@sonan_user_coords";

/** Select optimal calculation parameters based on user's geographic coordinates */
export function getCalculationParameters(latitude: number, longitude: number) {
  // Egypt and surrounding North Africa
  if (latitude >= 22 && latitude <= 32 && longitude >= 24 && longitude <= 37) {
    return CalculationMethod.Egyptian();
  }
  // Saudi Arabia & Gulf
  if (latitude >= 15 && latitude <= 33 && longitude >= 34 && longitude <= 60) {
    // UAE
    if (
      latitude >= 22 &&
      latitude <= 26.5 &&
      longitude >= 51 &&
      longitude <= 56.5
    ) {
      return CalculationMethod.Dubai();
    }
    // Qatar
    if (
      latitude >= 24.5 &&
      latitude <= 26.5 &&
      longitude >= 50.5 &&
      longitude <= 51.7
    ) {
      return CalculationMethod.Qatar();
    }
    // Kuwait
    if (
      latitude >= 28.5 &&
      latitude <= 30.5 &&
      longitude >= 46.5 &&
      longitude <= 48.5
    ) {
      return CalculationMethod.Kuwait();
    }
    return CalculationMethod.UmmAlQura();
  }
  // North America
  if (
    latitude >= 24 &&
    latitude <= 72 &&
    longitude >= -170 &&
    longitude <= -50
  ) {
    return CalculationMethod.NorthAmerica();
  }
  // South Asia (Pakistan, India, Bangladesh)
  if (latitude >= 6 && latitude <= 37 && longitude >= 60 && longitude <= 98) {
    return CalculationMethod.Karachi();
  }
  // Turkey
  if (latitude >= 35 && latitude <= 43 && longitude >= 25 && longitude <= 45) {
    return CalculationMethod.Turkey();
  }
  // Singapore & Southeast Asia
  if (latitude >= -11 && latitude <= 8 && longitude >= 95 && longitude <= 141) {
    return CalculationMethod.Singapore();
  }
  // Default worldwide standard
  return CalculationMethod.MuslimWorldLeague();
}

/** Calculate offline prayer times for a specific date given coordinates */
export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): PrayerTimesResult {
  const coordinates = new Coordinates(latitude, longitude);
  const params = getCalculationParameters(latitude, longitude);
  const pt = new PrayerTimes(coordinates, date, params);

  return {
    source: "calc",
    fajr: { hour: pt.fajr.getHours(), minute: pt.fajr.getMinutes() },
    dhuhr: { hour: pt.dhuhr.getHours(), minute: pt.dhuhr.getMinutes() },
    asr: { hour: pt.asr.getHours(), minute: pt.asr.getMinutes() },
    maghrib: { hour: pt.maghrib.getHours(), minute: pt.maghrib.getMinutes() },
    ishaa: { hour: pt.isha.getHours(), minute: pt.isha.getMinutes() },
    fetchedAt: new Date().toISOString(),
    latitude,
    longitude,
  };
}

/** Retrieve prayer times using offline calculation with cached coordinates fallback */
export async function getPrayerTimes(
  forceRefresh = false
): Promise<PrayerTimesResult> {
  try {
    if (!forceRefresh) {
      // 1. Check cached coordinates
      const cached = await AsyncStorage.getItem(COORDS_STORAGE_KEY);
      if (cached) {
        const { latitude, longitude } = JSON.parse(cached);
        if (typeof latitude === "number" && typeof longitude === "number") {
          return calculatePrayerTimes(latitude, longitude, new Date());
        }
      }
    }

    // 2. Request permission (will not prompt if already granted or denied)
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return getFallbackTimes();
    }

    // 3. Get low-accuracy / city-level coordinates
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });

    const { latitude, longitude } = location.coords;

    // Cache coordinates for instant 100% offline calculations next time
    await AsyncStorage.setItem(
      COORDS_STORAGE_KEY,
      JSON.stringify({ latitude, longitude })
    );

    return calculatePrayerTimes(latitude, longitude, new Date());
  } catch (error) {
    console.warn(
      "Failed to calculate offline prayer times, using fallback:",
      error
    );

    // Try using cached coordinates even on error
    try {
      const cached = await AsyncStorage.getItem(COORDS_STORAGE_KEY);
      if (cached) {
        const { latitude, longitude } = JSON.parse(cached);
        if (typeof latitude === "number" && typeof longitude === "number") {
          const result = calculatePrayerTimes(latitude, longitude, new Date());
          return { ...result, source: "cache" };
        }
      }
    } catch {
      // Ignore cache read errors
    }

    return getFallbackTimes();
  }
}

export function getFallbackTimes(): PrayerTimesResult {
  return {
    source: "fallback",
    fajr: REMINDER_SLOT_TIMES.fajr,
    dhuhr: REMINDER_SLOT_TIMES.dhuhr,
    asr: REMINDER_SLOT_TIMES.asr,
    maghrib: REMINDER_SLOT_TIMES.maghrib,
    ishaa: REMINDER_SLOT_TIMES.ishaa,
    fetchedAt: null,
  };
}
