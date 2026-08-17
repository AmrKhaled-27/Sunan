import { daysBetween, todayStr } from "./date";

/**
 * Appends today's date to the streak dates array.
 * If the streak was broken (gap >= 2 days), resets the streak to [today].
 * If today is already marked, returns the existing array unchanged.
 */
export function appendStreakDate(currentStreakDates: string[]): string[] {
  const today = todayStr();
  if (currentStreakDates.length === 0) {
    return [today];
  }
  const lastDate = currentStreakDates[currentStreakDates.length - 1];
  if (lastDate === today) {
    return currentStreakDates;
  }
  const gap = daysBetween(lastDate, today);
  if (gap >= 2) {
    return [today];
  }
  return [...currentStreakDates, today];
}
