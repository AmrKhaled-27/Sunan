const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-ts.cjs");
const load = createLoader();
const { SUNNAHS } = load("@/constants/sunnahs");
const { ROUTINES } = load("@/constants/routines");
const { validateCatalog, routineMembers, remainingMembers, nextRoutineId } =
  load("@/utils/routine");
const { freshState, recoverState, transitionRoutine } = load(
  "@/utils/routineState",
);
const { todayStr } = load("@/utils/date");
const today = todayStr();
function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("fifteen routines cover 45 Sunnahs once in agreed order with expected reminder slots", () => {
  validateCatalog(SUNNAHS, ROUTINES);
  assert.equal(ROUTINES.length, 15);
  assert.equal(new Set(ROUTINES.flatMap((r) => r.sunnahIds)).size, 45);
  assert.deepEqual(
    ROUTINES.map((r) => r.sunnahIds),
    [
      ["1", "3", "4", "2"],
      ["5", "6", "7"],
      ["14", "15"],
      ["16", "17"],
      ["8", "9"],
      ["18", "10", "11", "24"],
      ["19", "12", "20", "22"],
      ["13", "23", "25", "26"],
      ["21"],
      ["27", "28"],
      ["29", "30"],
      ["31", "32", "33", "34"],
      ["35", "36", "37", "38"],
      ["39", "40", "41", "42"],
      ["43", "44", "45"],
    ],
  );
  const prayer = ["fajr", "dhuhr", "asr", "maghrib", "ishaa"];
  const sleep = ["ishaa", "before_sleep"];
  const expectedSlots = [
    prayer,
    prayer,
    prayer,
    ["morning", "afternoon", "maghrib"],
    ["fajr", "morning", "dhuhr", "asr", "maghrib", "ishaa", "before_sleep"],
    sleep,
    sleep,
    sleep,
    sleep,
    ["fajr", "dhuhr"],
    ["maghrib", "ishaa"],
    prayer,
    sleep,
    ["fajr", "morning"],
    ["morning", "dhuhr", "asr", "maghrib"],
  ];
  for (const [index, r] of ROUTINES.entries()) {
    assert.deepEqual(r.notificationSchedule, {
      reminderSlots: expectedSlots[index],
      endOfDayCheckIn: true,
    });
    assert.deepEqual(
      routineMembers(r).map((s) => s.id),
      r.sunnahIds,
    );
  }
});

test("catalog validation rejects malformed IDs, memberships and schedules", () => {
  const mutations = [
    (s) => s.push(s[0]),
    (_, r) => r.push(r[0]),
    (_, r) => r[0].sunnahIds.push("unknown"),
    (_, r) => {
      r[0].sunnahIds = [];
    },
    (_, r) => r[0].sunnahIds.push(r[0].sunnahIds[0]),
    (_, r) => r[0].notificationSchedule.reminderSlots.push("invalid"),
    (_, r) => r[0].notificationSchedule.reminderSlots.push("fajr"),
    (_, r) => r[0].sunnahIds.pop(),
    (_, r) => r[1].sunnahIds.push(r[0].sunnahIds[0]),
  ];
  for (const mutate of mutations) {
    const s = structuredClone(SUNNAHS),
      r = structuredClone(ROUTINES);
    mutate(s, r);
    assert.throws(() => validateCatalog(s, r));
  }
  assert.throws(() =>
    routineMembers({ ...ROUTINES[0], sunnahIds: ["missing"] }),
  );
});

test("rotation prioritizes unpostponed routines, then cycles postponed-only routines", () => {
  assert.equal(nextRoutineId(null, [], []), ROUTINES[0].id);
  assert.equal(
    nextRoutineId(ROUTINES[0].id, [], [ROUTINES[0].id]),
    ROUTINES[1].id,
  );
  const postponed = ROUTINES.map((r) => r.id);
  assert.equal(nextRoutineId(ROUTINES[0].id, [], postponed), ROUTINES[1].id);
  const lastRoutine = ROUTINES[ROUTINES.length - 1];
  assert.equal(nextRoutineId(lastRoutine.id, [], postponed), ROUTINES[0].id);
  const lastSunnah = SUNNAHS[SUNNAHS.length - 1];
  const allButLast = SUNNAHS.filter((s) => s.id !== lastSunnah.id).map((s) => s.id);
  assert.equal(
    nextRoutineId(lastRoutine.id, allButLast, postponed),
    lastRoutine.id,
  );
  assert.equal(
    nextRoutineId(
      null,
      SUNNAHS.map((s) => s.id),
      [],
    ),
    null,
  );
});

test("deprecated members and routines do not block rotation", () => {
  const sajdaRoutine = ROUTINES.find((r) => r.id === "sajda_mulk");
  const member = SUNNAHS.find((s) => s.id === "21");
  try {
    member.deprecated = true;
    assert.deepEqual(remainingMembers(sajdaRoutine, []), []);
    assert.equal(
      nextRoutineId(
        null,
        SUNNAHS.filter((s) => s.id !== "21").map((s) => s.id),
        [],
      ),
      null,
    );
    ROUTINES[0].deprecated = true;
    assert.equal(nextRoutineId(null, [], []), ROUTINES[1].id);
  } finally {
    member.deprecated = false;
    delete ROUTINES[0].deprecated;
  }
});

test("daily mark is idempotent; seventh day credits four members and next routine can mark today", () => {
  const initial = freshState();
  const marked = transitionRoutine(initial, "mark");
  assert.deepEqual(marked.streakDates, [today]);
  assert.equal(marked.longestStreak, 1);
  assert.equal(transitionRoutine(marked, "mark"), marked);
  assert.equal(transitionRoutine(marked, "mark", initial), marked);
  const six = { ...initial, streakDates: [-6, -5, -4, -3, -2, -1].map(day) };
  const complete = transitionRoutine(six, "mark");
  assert.deepEqual(complete.accomplishedIds, ["1", "3", "4", "2"]);
  assert.equal(complete.totalCompleted, 4);
  assert.equal(complete.longestStreak, 7);
  assert.deepEqual(complete.streakDates, []);
  assert.equal(complete.currentRoutineId, ROUTINES[1].id);
  assert.ok(
    complete.accomplishedRecords.every(
      (r) =>
        r.completedAt === today &&
        r.method === "streak" &&
        r.routineId === ROUTINES[0].id,
    ),
  );
  assert.equal(transitionRoutine(complete, "mark", six), complete);
  assert.deepEqual(transitionRoutine(complete, "mark").streakDates, [today]);
});

test("already doing credits remaining members once, and stale action cannot advance twice", () => {
  const original = freshState();
  const initial = {
    ...original,
    accomplishedIds: ["1"],
    accomplishedRecords: [{ id: "1", completedAt: day(-8), method: "streak" }],
    totalCompleted: 1,
  };
  const complete = transitionRoutine(initial, "already_doing");
  assert.equal(complete.totalCompleted, 4);
  assert.equal(complete.accomplishedRecords.length, 4);
  assert.equal(
    complete.accomplishedRecords.filter((r) => r.method === "already_doing")
      .length,
    3,
  );
  assert.equal(transitionRoutine(complete, "already_doing", initial), complete);
  assert.deepEqual(complete.streakDates, []);
});

test("postpone resets streak, avoids duplicate IDs and preserves last-routine self-selection", () => {
  const initial = { ...freshState(), streakDates: [today] };
  const skipped = transitionRoutine(initial, "postpone");
  assert.equal(skipped.currentRoutineId, ROUTINES[1].id);
  assert.deepEqual(skipped.streakDates, []);
  assert.deepEqual(skipped.skippedRoutineIds, [ROUTINES[0].id]);
  assert.equal(transitionRoutine(skipped, "postpone", initial), skipped);
  const lastRoutine = ROUTINES[ROUTINES.length - 1];
  const lastSunnah = SUNNAHS[SUNNAHS.length - 1];
  const last = {
    ...freshState(),
    currentRoutineId: lastRoutine.id,
    accomplishedIds: SUNNAHS.filter((s) => s.id !== lastSunnah.id).map((s) => s.id),
    skippedRoutineIds: [lastRoutine.id],
    streakDates: [today],
  };
  const postponed = transitionRoutine(last, "postpone");
  assert.equal(postponed.currentRoutineId, lastRoutine.id);
  assert.deepEqual(postponed.skippedRoutineIds, [lastRoutine.id]);
  assert.deepEqual(postponed.streakDates, []);
  const complete = transitionRoutine(postponed, "already_doing");
  assert.equal(complete.currentRoutineId, null);
  assert.equal(complete.totalCompleted, SUNNAHS.length);
  assert.equal(transitionRoutine(complete, "mark"), complete);
});

test("missed day resets continuity both on mark and reload; yesterday remains valid", () => {
  const old = { ...freshState(), streakDates: [day(-3), day(-2)] };
  assert.deepEqual(transitionRoutine(old, "mark").streakDates, [today]);
  assert.equal(recoverState(old).streakBroken, true);
  assert.deepEqual(recoverState(old).state.streakDates, []);
  const yesterday = { ...freshState(), streakDates: [day(-1)] };
  assert.deepEqual(recoverState(yesterday).state.streakDates, [day(-1)]);
  assert.deepEqual(transitionRoutine(yesterday, "mark").streakDates, [
    day(-1),
    today,
  ]);
});

test("local day watcher refreshes at midnight, rearms and cleans up", () => {
  const { watchLocalDay } = load("@/utils/dayBoundary");
  let now = new Date(2026, 9, 24, 23, 59, 59, 500);
  let pending, delay, cleared;
  let refreshes = 0;
  const stop = watchLocalDay(
    () => {
      refreshes++;
    },
    () => now,
    (callback, milliseconds) => {
      pending = callback;
      delay = milliseconds;
      return 7;
    },
    (timer) => {
      cleared = timer;
    },
  );
  assert.equal(delay, 500);
  now = new Date(2026, 9, 25, 0, 0, 0);
  pending();
  assert.equal(refreshes, 1);
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  assert.equal(delay, tomorrow.getTime() - now.getTime());
  stop();
  assert.equal(cleared, 7);
  pending();
  assert.equal(refreshes, 1);
});

test("v3 recovery filters wrong catalog IDs and duplicate records, recovers selection without inheriting streak", () => {
  assert.deepEqual(recoverState(null).state, freshState());
  assert.deepEqual(
    recoverState({ version: 2, accomplishedIds: ["1"] }).state,
    freshState(),
  );
  const malformed = {
    ...freshState(),
    currentRoutineId: "1",
    streakDates: [today],
    accomplishedIds: ["1", "1", "unknown", "eating"],
    skippedRoutineIds: ["1", "eating", "eating"],
    accomplishedRecords: [
      { id: "1", method: "streak", completedAt: today },
      { id: "1" },
      { id: "unknown" },
    ],
    totalCompleted: 99,
  };
  const recovered = recoverState(malformed).state;
  assert.deepEqual(recovered.accomplishedIds, ["1"]);
  assert.deepEqual(recovered.skippedRoutineIds, ["eating"]);
  assert.equal(recovered.accomplishedRecords.length, 1);
  assert.equal(recovered.totalCompleted, 1);
  assert.equal(recovered.currentRoutineId, ROUTINES[0].id);
  assert.deepEqual(recovered.streakDates, []);
  const done = recoverState({
    ...freshState(),
    accomplishedIds: ROUTINES[0].sunnahIds,
    streakDates: [today],
  }).state;
  assert.equal(done.currentRoutineId, ROUTINES[1].id);
  assert.deepEqual(done.streakDates, []);
  assert.deepEqual(
    recoverState({ ...freshState(), streakDates: ["2026-99-99"] }).state
      .streakDates,
    [],
  );
});

test("storage ignores existing v2 key, persists and reloads v3, orders writes and resets", async () => {
  const memory = new Map([
    [
      "@sonan_state_v2",
      JSON.stringify({
        accomplishedIds: ["1"],
        settings: { notificationsEnabled: false },
      }),
    ],
  ]);
  const reads = [];
  const storage = createLoader({
    "@react-native-async-storage/async-storage": {
      getItem: async (key) => {
        reads.push(key);
        return memory.get(key) ?? null;
      },
      setItem: async (key, value) => {
        await new Promise((resolve) => setTimeout(resolve, 2));
        memory.set(key, value);
      },
      removeItem: async (key) => {
        memory.delete(key);
      },
    },
  })("@/services/storage");
  assert.deepEqual((await storage.loadPersistedState()).state, freshState());
  assert.deepEqual(reads, ["@sonan_state_v3"]);
  const marked = transitionRoutine(freshState(), "already_doing");
  await Promise.all([
    storage.savePersistedState(freshState()),
    storage.savePersistedState(marked),
  ]);
  assert.deepEqual((await storage.loadPersistedState()).state, marked);
  await storage.clearPersistedState();
  assert.deepEqual((await storage.loadPersistedState()).state, freshState());
  assert.ok(memory.has("@sonan_state_v2"));
});

test("storage retains loaded progress when normalization or a previous write fails", async () => {
  const progress = transitionRoutine(freshState(), "already_doing");
  const serialized = JSON.stringify(progress);
  const storage = createLoader({
    "@react-native-async-storage/async-storage": {
      getItem: async () => serialized,
      setItem: async () => {
        throw Error("disk full");
      },
    },
  })("@/services/storage");
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args);
  };
  try {
    await assert.rejects(storage.savePersistedState(freshState()), /disk full/);
    assert.deepEqual((await storage.loadPersistedState()).state, progress);
    assert.deepEqual((await storage.loadPersistedState()).state, progress);
    assert.equal(errors.length, 2);
  } finally {
    console.error = originalError;
  }
});

function notificationHarness() {
  const scheduled = new Map();
  let permission = true,
    onSchedule = null;
  const api = {
    getPermissionsAsync: async () => ({
      status: permission ? "granted" : "denied",
    }),
    requestPermissionsAsync: async () => ({
      status: permission ? "granted" : "denied",
    }),
    cancelAllScheduledNotificationsAsync: async () => {
      scheduled.clear();
    },
    scheduleNotificationAsync: async (n) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      scheduled.set(n.identifier, n);
      if (onSchedule) {
        const fn = onSchedule;
        onSchedule = null;
        fn();
      }
    },
    SchedulableTriggerInputTypes: { DATE: "date" },
  };
  const service = createLoader({
    "expo-notifications": api,
    "react-native": { Platform: { OS: "android" } },
    "@/services/prayerTimes": {
      calculatePrayerTimes: () => {
        throw Error("unexpected calculation");
      },
    },
  })("@/services/notifications");
  return {
    service,
    scheduled,
    setPermission: (value) => {
      permission = value;
    },
    onSchedule: (fn) => {
      onSchedule = fn;
    },
  };
}

test("notifications use routine payload, slot union, daily suppression and fixed bedtime", async () => {
  const { service, scheduled } = notificationHarness();
  await service.scheduleRoutineNotifications(
    ROUTINES[0],
    23,
    15,
    3,
    true,
    null,
  );
  const entries = [...scheduled.values()];
  assert.equal(entries.length, 6 * 7); // 5 slots + check-in + streak, on six future dates
  assert.ok(
    entries.every(
      (n) =>
        !n.identifier.endsWith("day0") &&
        n.content.data.routineId === ROUTINES[0].id &&
        !("sunnahId" in n.content.data),
    ),
  );
  assert.equal(new Set(entries.map((n) => n.identifier)).size, entries.length);
  await service.scheduleRoutineNotifications(
    ROUTINES[5],
    23,
    15,
    0,
    true,
    null,
  );
  const sleep = scheduled.get("reminder_before_sleep_day1");
  assert.equal(sleep.trigger.date.getHours(), 22);
  assert.equal(sleep.trigger.date.getMinutes(), 0);
  assert.equal(scheduled.get("checkin_day1").trigger.date.getHours(), 23);
  assert.equal(scheduled.get("checkin_day1").trigger.date.getMinutes(), 15);
});

test("overlapping reschedules leave only latest routine; disabled, denied and all-complete cancel reminders", async () => {
  const h = notificationHarness();
  let later;
  h.scheduled.set("legacy-v2", { content: { data: { sunnahId: "1" } } });
  h.onSchedule(() => {
    later = h.service.scheduleRoutineNotifications(
      ROUTINES[1],
      22,
      0,
      0,
      false,
      null,
    );
  });
  await h.service.scheduleRoutineNotifications(
    ROUTINES[0],
    22,
    0,
    0,
    false,
    null,
  );
  await later;
  assert.ok(h.scheduled.size > 0);
  assert.ok(
    [...h.scheduled.values()].every(
      (n) => n.content.data.routineId === ROUTINES[1].id,
    ),
  );
  await h.service.scheduleRoutineNotifications(
    ROUTINES[1],
    22,
    0,
    0,
    false,
    null,
    false,
  );
  assert.equal(h.scheduled.size, 0);
  await h.service.scheduleRoutineNotifications(
    ROUTINES[8],
    22,
    0,
    0,
    false,
    null,
  );
  await h.service.scheduleRoutineNotifications(null, 22, 0, 0, false, null);
  assert.equal(h.scheduled.size, 0);
  h.setPermission(false);
  h.scheduled.set("legacy-v2", {});
  await h.service.scheduleRoutineNotifications(
    ROUTINES[0],
    22,
    0,
    0,
    false,
    null,
  );
  assert.equal(h.scheduled.size, 0);
});
