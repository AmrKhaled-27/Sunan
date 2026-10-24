import { ROUTINES } from "@/constants/routines";
import { SUNNAHS } from "@/constants/sunnahs";
import { Routine, Sunnah } from "@/types";

const VALID_SLOTS = new Set([
  "fajr",
  "morning",
  "dhuhr",
  "asr",
  "afternoon",
  "maghrib",
  "ishaa",
  "before_sleep",
]);

export function validateCatalog(sunnahs: Sunnah[], routines: Routine[]) {
  function unique(ids: string[], label: string) {
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label}`);
  }
  unique(
    sunnahs.map((s) => s.id),
    "Sunnah ID",
  );
  unique(
    routines.map((r) => r.id),
    "routine ID",
  );
  const coverage = new Map<string, number>();
  for (const r of routines) {
    if (!r.sunnahIds.length) throw new Error(`Empty routine ${r.id}`);
    unique(r.sunnahIds, `member in ${r.id}`);
    unique(r.notificationSchedule.reminderSlots, `reminder slot in ${r.id}`);
    for (const slot of r.notificationSchedule.reminderSlots) {
      if (!VALID_SLOTS.has(slot))
        throw new Error(`Invalid reminder slot ${slot} in ${r.id}`);
    }
    for (const id of r.sunnahIds) {
      if (!sunnahs.some((s) => s.id === id))
        throw new Error(`Unknown member ${id} in ${r.id}`);
      if (!r.deprecated) coverage.set(id, (coverage.get(id) ?? 0) + 1);
    }
  }
  for (const s of sunnahs.filter((s) => !s.deprecated)) {
    if (coverage.get(s.id) !== 1)
      throw new Error(
        `Active Sunnah ${s.id} must belong to exactly one active routine`,
      );
  }
}

validateCatalog(SUNNAHS, ROUTINES);

export function routineMembers(routine: Routine): Sunnah[] {
  return routine.sunnahIds
    .map((id) => {
      const member = SUNNAHS.find((s) => s.id === id);
      if (!member) throw new Error(`Unknown member ${id} in ${routine.id}`);
      return member;
    })
    .filter((s) => !s.deprecated);
}

export function remainingMembers(routine: Routine, accomplishedIds: string[]) {
  return routineMembers(routine).filter((s) => !accomplishedIds.includes(s.id));
}

export function nextRoutineId(
  currentId: string | null,
  accomplishedIds: string[],
  skippedRoutineIds: string[],
): string | null {
  const unfinished = ROUTINES.filter(
    (r) => !r.deprecated && remainingMembers(r, accomplishedIds).length,
  );
  const unpostponed = unfinished.filter(
    (r) => !skippedRoutineIds.includes(r.id),
  );
  if (unpostponed.length) return unpostponed[0].id;
  const index = unfinished.findIndex((r) => r.id === currentId);
  return unfinished.length
    ? unfinished[(index + 1) % unfinished.length].id
    : null;
}
