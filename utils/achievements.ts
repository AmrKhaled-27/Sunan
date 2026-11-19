import { ROUTINE_GROUPS, ROUTINES } from "@/constants/routines";
import { AccomplishedRecord, Routine, Sunnah } from "@/types";
import { routineMembers } from "./routine";

export interface AchievementItem {
  sunnah: Sunnah;
  record?: AccomplishedRecord;
}

export interface AchievementPart {
  key: string;
  /** Short label for this part; null when the collection has a single routine. */
  label: string | null;
  /** 1-based position of this part within its group; null when ungrouped. */
  number: number | null;
  items: AchievementItem[];
}

export interface AchievementCollection {
  id: string;
  title: string;
  parts: AchievementPart[];
  completedCount: number;
  totalCount: number;
}

const OTHER_ID = "__other__";
const OTHER_TITLE = "سنن أخرى";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

function routineFor(
  sunnahId: string,
  record: AccomplishedRecord | undefined,
  routines: Routine[],
): Routine | null {
  const owners = routines.filter((r) => r.sunnahIds.includes(sunnahId));
  return (
    owners.find((r) => !r.deprecated) ??
    owners.find((r) => r.id === record?.routineId) ??
    owners[0] ??
    routines.find((r) => r.id === record?.routineId) ??
    null
  );
}

function collectionKey(routine: Routine | null) {
  if (!routine) return OTHER_ID;
  return routine.groupId ? `group:${routine.groupId}` : `routine:${routine.id}`;
}

function totalFor(routines: Routine[]) {
  return routines
    .filter((r) => !r.deprecated)
    .reduce((sum, r) => sum + routineMembers(r).length, 0);
}

/**
 * Groups accomplished Sunnahs by routine family (multi-part routines share one
 * collection). Collections are ordered by most recent accomplishment; parts and
 * members keep the catalog's learning order.
 */
export function buildAchievementCollections(
  accomplished: Sunnah[],
  records: AccomplishedRecord[],
  routines: Routine[] = ROUTINES,
  groups = ROUTINE_GROUPS,
): AchievementCollection[] {
  const recordsById = new Map(records.map((r) => [r.id, r]));
  const buckets = new Map<
    string,
    { latest: number; byRoutine: Map<string, AchievementItem[]> }
  >();

  accomplished.forEach((sunnah, order) => {
    const record = recordsById.get(sunnah.id);
    const routine = routineFor(sunnah.id, record, routines);
    const key = collectionKey(routine);
    const bucket = buckets.get(key) ?? { latest: -1, byRoutine: new Map() };
    bucket.latest = Math.max(bucket.latest, order);
    const routineKey = routine?.id ?? OTHER_ID;
    bucket.byRoutine.set(routineKey, [
      ...(bucket.byRoutine.get(routineKey) ?? []),
      { sunnah, record },
    ]);
    buckets.set(key, bucket);
  });

  const collections = [...buckets.entries()].map(([key, bucket]) => {
    const sortItems = (
      routine: Routine | undefined,
      items: AchievementItem[],
    ) =>
      routine
        ? [...items].sort(
            (a, b) =>
              routine.sunnahIds.indexOf(a.sunnah.id) -
              routine.sunnahIds.indexOf(b.sunnah.id),
          )
        : items;

    if (key === OTHER_ID) {
      const items = bucket.byRoutine.get(OTHER_ID) ?? [];
      return {
        latest: bucket.latest,
        collection: {
          id: OTHER_ID,
          title: OTHER_TITLE,
          parts: [{ key: OTHER_ID, label: null, number: null, items }],
          completedCount: items.length,
          totalCount: items.length,
        },
      };
    }

    const groupId = key.startsWith("group:") ? key.slice(6) : null;
    const familyRoutines = groupId
      ? routines.filter((r) => r.groupId === groupId)
      : routines.filter((r) => `routine:${r.id}` === key);
    const parts: AchievementPart[] = familyRoutines
      .map((routine, index) => ({
        key: routine.id,
        label: groupId ? (routine.partTitle ?? routine.title) : null,
        number: groupId ? index + 1 : null,
        items: sortItems(routine, bucket.byRoutine.get(routine.id) ?? []),
      }))
      .filter((part) => part.items.length);
    const completedCount = parts.reduce((n, p) => n + p.items.length, 0);
    const title = groupId
      ? (groups.find((g) => g.id === groupId)?.title ?? familyRoutines[0].title)
      : familyRoutines[0].title;

    return {
      latest: bucket.latest,
      collection: {
        id: key,
        title,
        parts,
        completedCount,
        totalCount: Math.max(completedCount, totalFor(familyRoutines)),
      },
    };
  });

  return collections
    .sort((a, b) => b.latest - a.latest)
    .map((entry) => entry.collection);
}
