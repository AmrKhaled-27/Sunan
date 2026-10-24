import { ROUTINES } from "@/constants/routines";
import { SUNNAHS } from "@/constants/sunnahs";
import { PersistedState, UserSettings } from "@/types";
import { daysBetween, todayStr } from "./date";
import { nextRoutineId, remainingMembers } from "./routine";
import { appendStreakDate } from "./streak";

export const DEFAULT_SETTINGS: UserSettings = {
  endOfDayHour: 22,
  endOfDayMinute: 0,
  notificationsEnabled: true,
};

export function freshState(): PersistedState {
  return {
    version: 3,
    currentRoutineId: nextRoutineId(null, [], []),
    streakDates: [],
    accomplishedIds: [],
    accomplishedRecords: [],
    skippedRoutineIds: [],
    settings: { ...DEFAULT_SETTINGS },
    totalCompleted: 0,
    longestStreak: 0,
  };
}

export function recoverState(input: unknown): {
  state: PersistedState;
  streakBroken: boolean;
} {
  const initial = freshState();
  if (
    !input ||
    typeof input !== "object" ||
    !("version" in input) ||
    input.version !== 3
  ) {
    return { state: initial, streakBroken: false };
  }
  const p = input as Partial<PersistedState>;
  const ids = (value: unknown, allowed: string[]) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && allowed.includes(id),
            ),
          ),
        ]
      : [];
  const accomplishedIds = ids(
    p.accomplishedIds,
    SUNNAHS.map((s) => s.id),
  );
  const skippedRoutineIds = ids(
    p.skippedRoutineIds,
    ROUTINES.filter((r) => !r.deprecated).map((r) => r.id),
  );
  const active = ROUTINES.find(
    (r) => r.id === p.currentRoutineId && !r.deprecated,
  );
  const currentRoutineId =
    active && remainingMembers(active, accomplishedIds).length
      ? active.id
      : nextRoutineId(
          p.currentRoutineId ?? null,
          accomplishedIds,
          skippedRoutineIds,
        );
  const dateValid = (date: unknown): date is string => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  };
  let streakDates = Array.isArray(p.streakDates)
    ? p.streakDates.filter(dateValid)
    : [];
  const today = todayStr();
  const streakBroken =
    streakDates.length > 0 &&
    daysBetween(streakDates[streakDates.length - 1], today) >= 2;
  if (
    currentRoutineId !== p.currentRoutineId ||
    !currentRoutineId ||
    streakBroken ||
    streakDates.length >= 7 ||
    streakDates.some(
      (date, i) =>
        date > today ||
        (i > 0 &&
          (date <= streakDates[i - 1] ||
            daysBetween(streakDates[i - 1], date) !== 1)),
    )
  )
    streakDates = [];
  const records = Array.isArray(p.accomplishedRecords)
    ? p.accomplishedRecords
    : [];
  const accomplishedRecords = accomplishedIds.map((id) => {
    const record = records.find((r) => r && r.id === id);
    return {
      id,
      completedAt: dateValid(record?.completedAt) ? record.completedAt : null,
      method:
        record?.method === "streak" || record?.method === "already_doing"
          ? record.method
          : null,
      ...(record?.routineId && ROUTINES.some((r) => r.id === record.routineId)
        ? { routineId: record.routineId }
        : {}),
    };
  });
  const settings = p.settings;
  const validTime = (n: unknown, max: number): n is number =>
    Number.isInteger(n) && (n as number) >= 0 && (n as number) <= max;
  return {
    state: {
      version: 3,
      currentRoutineId,
      streakDates,
      accomplishedIds,
      accomplishedRecords,
      skippedRoutineIds,
      settings: {
        endOfDayHour: validTime(settings?.endOfDayHour, 23)
          ? settings.endOfDayHour
          : DEFAULT_SETTINGS.endOfDayHour,
        endOfDayMinute: validTime(settings?.endOfDayMinute, 59)
          ? settings.endOfDayMinute
          : DEFAULT_SETTINGS.endOfDayMinute,
        notificationsEnabled:
          typeof settings?.notificationsEnabled === "boolean"
            ? settings.notificationsEnabled
            : true,
      },
      totalCompleted: accomplishedIds.length,
      longestStreak: Math.max(
        streakDates.length,
        typeof p.longestStreak === "number" && Number.isFinite(p.longestStreak)
          ? Math.max(0, Math.floor(p.longestStreak))
          : 0,
      ),
    },
    streakBroken,
  };
}

export type RoutineAction = "mark" | "already_doing" | "postpone";

// Only the snapshot displayed when the callback was bound may handle its action.
export function transitionRoutine(
  state: PersistedState,
  action: RoutineAction,
  expected: PersistedState = state,
): PersistedState {
  if (state !== expected) return state;
  const routine = ROUTINES.find(
    (r) => r.id === state.currentRoutineId && !r.deprecated,
  );
  if (!routine) return state;
  if (action === "postpone") {
    const skippedRoutineIds = [
      ...new Set([...state.skippedRoutineIds, routine.id]),
    ];
    return {
      ...state,
      skippedRoutineIds,
      currentRoutineId: nextRoutineId(
        routine.id,
        state.accomplishedIds,
        skippedRoutineIds,
      ),
      streakDates: [],
    };
  }
  if (action === "mark" && state.streakDates.includes(todayStr())) return state;
  const streakDates =
    action === "mark" ? appendStreakDate(state.streakDates) : [];
  const longestStreak = Math.max(state.longestStreak, streakDates.length);
  if (action === "mark" && streakDates.length < (routine.streakDays ?? 7))
    return { ...state, streakDates, longestStreak };
  const credited = remainingMembers(routine, state.accomplishedIds);
  const accomplishedIds = [
    ...new Set([...state.accomplishedIds, ...credited.map((s) => s.id)]),
  ];
  return {
    ...state,
    accomplishedIds,
    accomplishedRecords: [
      ...(state.accomplishedRecords ?? []),
      ...credited.map((s) => ({
        id: s.id,
        routineId: routine.id,
        completedAt: todayStr(),
        method:
          action === "mark" ? ("streak" as const) : ("already_doing" as const),
      })),
    ],
    totalCompleted: accomplishedIds.length,
    longestStreak,
    streakDates: [],
    currentRoutineId: nextRoutineId(
      routine.id,
      accomplishedIds,
      state.skippedRoutineIds,
    ),
  };
}
