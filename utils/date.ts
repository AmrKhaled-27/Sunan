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

/**
 * Formats a 24-hour time (hour, minute) into 12-hour format with Arabic AM/PM (e.g., "10:00 م" or "08:30 ص").
 */
export function formatTime12h(hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const period = hour >= 12 ? "م" : "ص";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${pad(h12)}:${pad(minute)} ${period}`;
}

/**
 * Formats a 'YYYY-MM-DD' date into a long Arabic calendar label.
 */
export function formatArabicDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

