/**
 * Returns today's date string in 'YYYY-MM-DD' format using local time.
 */
export function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact number of calendar days between two 'YYYY-MM-DD' date strings,
 * using UTC midnight timestamps to ensure immunity to DST shifts and local timezone offsets.
 */
export function daysBetween(a: string, b: string): number {
  const [yA, mA, dA] = a.split("-").map(Number);
  const [yB, mB, dB] = b.split("-").map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round(Math.abs(utcB - utcA) / 86_400_000);
}

/**
 * Parses a "HH:mm" time string into numeric hour and minute.
 */
export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
}
