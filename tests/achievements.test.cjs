const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-ts.cjs");
const load = createLoader();
const { SUNNAHS } = load("@/constants/sunnahs");
const { ROUTINES, ROUTINE_GROUPS } = load("@/constants/routines");
const { validateCatalog } = load("@/utils/routine");
const { buildAchievementCollections, toArabicDigits } = load(
  "@/utils/achievements",
);

const byId = (id) => SUNNAHS.find((s) => s.id === id);
const record = (id, routineId) => ({
  id,
  routineId,
  completedAt: "2026-11-01",
  method: "streak",
});

test("multi-part routines reference known groups", () => {
  const groupIds = ROUTINES.filter((r) => r.groupId).map((r) => r.groupId);
  assert.deepEqual(
    [...new Set(groupIds)].sort(),
    ROUTINE_GROUPS.map((g) => g.id).sort(),
  );
  const broken = structuredClone(ROUTINES);
  broken[0].groupId = "missing";
  assert.throws(() => validateCatalog(SUNNAHS, broken));
});

test("after-prayer parts are grouped under one collection in part order", () => {
  // Part 2 member accomplished first, then part 1 members, then wudu.
  const ids = ["6", "1", "3", "31"];
  const collections = buildAchievementCollections(
    ids.map(byId),
    ids.map((id) => record(id)),
  );
  assert.deepEqual(
    collections.map((c) => c.title),
    ["سنن الوضوء", "أذكار ما بعد الصلاة"],
  );
  const afterPrayer = collections[1];
  assert.deepEqual(
    afterPrayer.parts.map((p) => [p.key, p.number]),
    [
      ["after_prayer_core", 1],
      ["after_prayer_recitation", 2],
    ],
  );
  assert.deepEqual(
    afterPrayer.parts[0].items.map((i) => i.sunnah.id),
    ["1", "3"],
  );
  assert.equal(afterPrayer.completedCount, 3);
  assert.equal(afterPrayer.totalCount, 7);
  assert.equal(collections[0].parts[0].label, null);
});

test("arabic digits helper", () => {
  assert.equal(toArabicDigits(12), "١٢");
});
