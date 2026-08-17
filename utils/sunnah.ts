import { SUNNAHS } from "@/constants/data";

/** Find the next available sunnah ID that is not accomplished or skipped */
export function nextSunnahId(
  currentId: string | null,
  accomplishedIds: string[],
  skippedIds: string[]
): string | null {
  // 1. First priority: Active Sunnahs that are neither accomplished nor skipped
  const unhandledSunnahs = SUNNAHS.filter(
    (s) =>
      !s.deprecated &&
      !accomplishedIds.includes(s.id) &&
      !skippedIds.includes(s.id)
  );

  if (unhandledSunnahs.length > 0) {
    const currentIdx = currentId
      ? unhandledSunnahs.findIndex((s) => s.id === currentId)
      : -1;
    if (currentIdx === -1) {
      return unhandledSunnahs[0].id;
    }
    const nextIdx = (currentIdx + 1) % unhandledSunnahs.length;
    return unhandledSunnahs[nextIdx].id;
  }

  // 2. Second priority: If all unhandled are done/skipped, cycle through remaining unaccomplished skipped ones
  const remainingUnaccomplished = SUNNAHS.filter(
    (s) => !s.deprecated && !accomplishedIds.includes(s.id)
  );

  if (remainingUnaccomplished.length > 0) {
    const currentIdx = currentId
      ? remainingUnaccomplished.findIndex((s) => s.id === currentId)
      : -1;
    if (currentIdx === -1) {
      return remainingUnaccomplished[0].id;
    }
    const nextIdx = (currentIdx + 1) % remainingUnaccomplished.length;
    return remainingUnaccomplished[nextIdx].id;
  }

  // 3. All sunnahs are accomplished!
  return null;
}
