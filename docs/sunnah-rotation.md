# Sunnah Rotation, Skipping, and "Already Doing"

How the app decides which Sunnah to show, the two escape hatches from the seven-day loop, and how the Sunnah catalog is structured.

---

# Part 1 — User Guide

## One at a time, in order

Sunan hands you Sunnahs one at a time, in the order they are listed in the app. You do not choose. When you finish one — by streak or by declaring you already do it — the next one appears automatically.

## «أفعلها بالفعل» — I already do this

Some Sunnahs will already be part of your life. Waiting seven days to confirm what you already do would be busywork, so tap **أفعلها بالفعل**.

A confirmation asks **«هل أنت متأكد؟»** and explains that this means you do it *regularly*, and that you will move straight to the next Sunnah. Confirm with **«نعم، أفعلها باستمرار»** or back out with **«رجوع»**.

The Sunnah is immediately added to your achievements, labelled **«كنت أفعلها»** so you can tell it apart from the ones you built up over seven days. It counts towards your completed total.

Use this honestly — the point of the app is the habits, not the number.

## «تخطي» — Skip for now

Sometimes a Sunnah does not fit your circumstances right now. Tap **تخطي**, confirm **«نعم، تخطي»**, and the app moves on.

Skipping is **not** the same as completing. The Sunnah is not added to your achievements and does not count towards your total. It is set aside, and the app will bring it back to you later, once you have worked through the Sunnahs you have not yet seen at all.

Skipping also clears any progress you had built on that Sunnah. If you were three days into a streak, you start from day one when it returns.

## What order things come back in

The app works through Sunnahs in two passes:

1. **First**, everything you have never completed and never skipped.
2. **Then**, it cycles back through the ones you skipped, so nothing is lost permanently.

## Finishing everything

When there is nothing left in either pass, the home tab shows **«أتممت جميع السنن!»** and reminders stop. Skipped Sunnahs must be either completed or declared already-done to reach this state — a skip alone does not retire a Sunnah.

## What is in the catalog

The app currently ships **ten** Sunnahs, all rated easy, drawn from a few areas of daily life: table manners (saying *bismillah* before eating, eating with the right hand), remembrances tied to prayer and to leaving the house, and daily dhikr such as saying *subhanallah wa bihamdih* a hundred times. Each carries the narration it comes from and the reward reported for it, with the source reference.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `utils/sunnah.ts` | `nextSunnahId` — the entire rotation algorithm |
| `context/SunnahContext.tsx` | `markAlreadyDoing`, `skipSunnah` |
| `constants/data.ts` | `SUNNAHS`, `SUNNAH_GROUPS`, `REMINDER_SLOT_TIMES` |
| `types/index.ts` | `Sunnah`, `SunnahGroup`, `AccomplishedRecord` |
| `screens/ActiveSunnah/components/AlreadyDoingModal.tsx` | Confirmation copy |
| `screens/ActiveSunnah/components/SkipModal.tsx` | Confirmation copy |
| `components/ui/ConfirmModal.tsx` | Shared confirmation shell |

## The rotation algorithm

`nextSunnahId(currentId, accomplishedIds, skippedIds)` is a pure function over the static catalog and the two ID lists. It works in three tiers.

**Tier 1 — never handled.** Filter out deprecated, accomplished, and skipped entries. If any remain, find the current ID's index *within that filtered list* and return the next element, wrapping modulo the list length. If the current ID is not in the filtered list — which is the case immediately after it was accomplished or skipped, since it was just added to one of the exclusion lists — `findIndex` returns `-1` and the function returns the first element instead.

`utils/sunnah.ts:18-25`

```ts
    const currentIdx = currentId
      ? unhandledSunnahs.findIndex((s) => s.id === currentId)
      : -1;
    if (currentIdx === -1) {
      return unhandledSunnahs[0].id;
    }
    const nextIdx = (currentIdx + 1) % unhandledSunnahs.length;
    return unhandledSunnahs[nextIdx].id;
```

The `-1` case doing the right thing by accident of `findIndex` semantics is worth being explicit about: **the common path is the `-1` path.** Both `markDoneToday` and `skipSunnah` call this with the exclusion list already updated, so tier 1 almost always resolves to "the first Sunnah nobody has touched". The modulo branch only matters if the function is ever called with a still-eligible current ID.

**Tier 2 — skipped but not accomplished.** Once tier 1 is empty, the filter relaxes to exclude only deprecated and accomplished entries, which re-admits everything skipped. The same index-and-wrap logic then cycles through them. This is what makes a skip a postponement rather than a deletion.

**Tier 3** returns `null`, which propagates to `currentSunnah === null` and the "all complete" screen.

Note that `skippedIds` is never cleared. A Sunnah stays on that list forever; tier 2 simply ignores the list's existence. Completing a previously skipped Sunnah adds it to `accomplishedIds`, which excludes it from both tiers.

## "Already doing" versus streak completion

`markAlreadyDoing` is structurally the same transition as the seven-day completion, minus the streak bookkeeping:

`context/SunnahContext.tsx:211-223`

```tsx
  const markAlreadyDoing = useCallback(() => {
    if (!currentSunnahId) return;
    const newAccomplished = [...accomplishedIds, currentSunnahId];
    const newRecords: AccomplishedRecord[] = [
      ...accomplishedRecords,
      {
        id: currentSunnahId,
        completedAt: todayStr(),
        method: "already_doing",
      },
    ];
    const newTotal = totalCompleted + 1;
    const newId = nextSunnahId(currentSunnahId, newAccomplished, skippedIds);
    // ...
```

The only differences from the streak path are `method: "already_doing"` and that `longestStreak` is untouched — declaring a habit does not fabricate a seven-day run. `streakDates` is reset to `[]` because any partial progress on the old Sunnah is meaningless once it is retired.

The `method` field is what the achievements tab reads to render the distinguishing badge. See [accomplishments.md](./accomplishments.md).

## Skipping

`context/SunnahContext.tsx:241-246`

```tsx
  const skipSunnah = useCallback(() => {
    if (!currentSunnahId) return;
    const newSkipped = skippedIds.includes(currentSunnahId)
      ? skippedIds
      : [...skippedIds, currentSunnahId];
    const newId = nextSunnahId(currentSunnahId, accomplishedIds, newSkipped);
```

The `includes` check keeps the list a de-facto set, which matters because tier 2 can hand a skipped Sunnah back and the user can skip it again — without the guard the list would grow unboundedly with duplicates.

Skip does **not** touch `accomplishedIds`, `accomplishedRecords`, `totalCompleted`, or `longestStreak`. It resets `streakDates`, which is the deliberate cost of skipping.

`skippedSunnahs` is exposed on the context and derived from the catalog, but no screen currently renders it. It is available if a "postponed" list is ever added to the UI.

## Catalog shape

Each entry conforms to `Sunnah` in `types/index.ts`:

| Field | Purpose |
| --- | --- |
| `id` | Permanent identifier. Currently `"1"`–`"10"`. |
| `title` | Arabic name shown on the card and in achievements |
| `action` | Colloquial "how to do it" text |
| `hadith` | The narration, rendered in Amiri |
| `category` | Free-form tag (`eating`, `dhikr`, `general`, …); not yet surfaced |
| `groupId` | Optional key into `SUNNAH_GROUPS`; not yet surfaced |
| `difficulty` | `easy` / `medium` / `hard`; all ten are currently `easy`; not yet surfaced |
| `reward` | Reported reward, shown in the gold panel |
| `rewardSource` | Citation for the reward, shown smaller beneath it |
| `notificationSchedule` | Which reminder slots and whether to send an end-of-day check-in |
| `notificationMessages` | Pool of reminder bodies, picked at random per notification |
| `deprecated` | Optional; excludes the entry from rotation without deleting it |

### The ID rule

`constants/data.ts:47-48`

```ts
// ─── Sunnah Data ──────────────────────────────────────────────────────────────
// RULE: Never change or reuse an existing ID. Mark deprecated instead of deleting.
```

This is not a style preference. `accomplishedIds`, `skippedIds`, `currentSunnahId`, and every `AccomplishedRecord` on a user's device are foreign keys into this array. Reusing `"3"` for a different Sunnah would silently rewrite the history of every existing install; deleting an entry would leave dangling IDs. The `deprecated` flag is the supported retirement path, and `nextSunnahId` filters on it in both tiers.

Note that a deprecated Sunnah still resolves through `SUNNAHS.find` in `currentSunnah` and in the achievements list, so a user who already completed it keeps seeing it in their history — which is the intended behaviour.

### `SUNNAH_GROUPS`

Three groups are defined (`eating_etiquette`, `after_prayer`, `toilet_etiquette`) with Arabic titles and emoji icons, and some Sunnahs carry a matching `groupId`. Nothing reads this yet. It is scaffolding for a future feature that would present related Sunnahs as a bundle.

## The confirmation modals

Both modals are thin configurations of `components/ui/ConfirmModal.tsx`, which supplies the dimmed backdrop, the parchment card, a gradient confirm `Button`, and a ghost cancel `Button`. The only per-modal choices are the copy and the confirm gradient:

- **Already doing** — `oliveGreen` → `oliveGreenDark`, the same green as the primary action, signalling a positive commitment.
- **Skip** — `warmBrownSubtle` → `warmBrownMuted`, deliberately muted so skipping never looks like the recommended path.
- **Reset** (in settings) — `danger` → `dangerDark`. See [settings.md](./settings.md).

`AlreadyDoingModal` interpolates the Sunnah title into its description so the user is confirming a specific claim rather than an abstract one. `SkipModal` does not, because its copy refers to the *next* Sunnah instead.

Both modals are dismissed by the screen before the context action is dispatched:

`screens/ActiveSunnah/index.tsx:323-326`

```tsx
				onConfirm={() => {
					setShowAlreadyConfirm(false);
					markAlreadyDoing();
				}}
```

Order matters. Dispatching first would swap `currentSunnah` while the modal was still mounted, and the modal's interpolated title would flash the *next* Sunnah's name during the fade-out.

## Adding a Sunnah

1. Append to `SUNNAHS` in `constants/data.ts` with the next unused ID. Do not insert in the middle unless you intend to change the order users encounter — new entries are picked up by tier 1 automatically, including for existing users who had already reached the "all complete" state.
2. Fill `notificationSchedule.reminderSlots` with slots that make contextual sense for the act; see [notifications.md](./notifications.md) for the available slots and how they resolve to clock times.
3. Provide at least two `notificationMessages`, since they are sampled with replacement and a single-element pool makes every reminder identical.
4. Provide `rewardSource` (or explicitly `null`) — the card renders it only when present, but the field is non-optional in the type.
