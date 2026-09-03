# Daily Sunnah (سنة اليوم)

The home tab. It shows the single Sunnah the user is currently working on and everything they need to understand it.

---

# Part 1 — User Guide

## What this screen is for

Sunan asks you to focus on one Sunnah at a time rather than a long checklist. The home tab, titled **سنة اليوم**, always shows that one Sunnah. Nothing else competes for your attention.

## What you see on the card

The card is laid out top to bottom in the order you would want to read it:

1. **The title** — the name of the Sunnah, for example «قول بسم الله قبل الأكل».
2. **The action (شرح العمل)** — a short, colloquial explanation of exactly what to do, including what to do if you forget. This is the practical instruction, not the theory.
3. **A small divider with a crescent**, separating instruction from evidence.
4. **The hadith** — the prophetic narration the Sunnah comes from, set in the Amiri serif typeface.
5. **The reward (الثواب والأجر)** — what this act earns you, in a bordered gold panel, with the narration reference underneath in smaller text.

Above the card you will find the seven streak dots and, on certain days, an encouraging banner. Those are covered in [streak-tracking.md](./streak-tracking.md).

## Reading a long hadith

Long narrations are shortened to roughly 120 characters, cut at a word boundary, and followed by an **«اقرأ المزيد...»** link. Tap the link — or tap the hadith text itself — to expand it, and **«عرض أقل»** to collapse it again. When the app moves you to a new Sunnah, the hadith starts collapsed again.

## The three buttons

Underneath the card:

- **فعلتها اليوم** — the large green button. Tap it after you have actually performed the Sunnah today. See [streak-tracking.md](./streak-tracking.md).
- **أفعلها بالفعل** — you already do this habitually and do not need seven days of practice.
- **تخطي** — postpone this one for now.

Both of the smaller buttons are explained in [sunnah-rotation.md](./sunnah-rotation.md).

## When you have finished everything

Once every Sunnah in the app has been completed, the card is replaced by the app icon and the message **«أتممت جميع السنن!»** with **«جزاك الله خيراً، انتظر إضافة سنن جديدة»**. Reminders stop at that point, since there is nothing left to remind you about.

## While the app is loading

On a cold start you may briefly see a gold spinner on the parchment background while saved progress is read from the device. This is normally imperceptible.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `app/(tabs)/index.tsx` | Route file; a thin re-export of the screen |
| `screens/ActiveSunnah/index.tsx` | The whole screen: layout, hadith truncation, haptics, modal orchestration |
| `components/ui/Card.tsx` | Card chrome, `variant="home"` |
| `components/ui/PaperBackground.tsx` | Parchment texture and corner foliage |
| `components/ui/Button.tsx` | The gradient primary button |
| `constants/data.ts` | `SUNNAHS`, the static catalog |
| `context/SunnahContext.tsx` | Everything the screen reads and every action it dispatches |

## Data the screen consumes

The screen is a pure consumer of `useSunnah()`; it holds no progress state of its own. It destructures `currentSunnah`, `streakCount`, `hasMarkedToday`, `streakBrokenToday`, `markDoneToday`, `markAlreadyDoing`, `skipSunnah`, and `isLoading`.

`currentSunnah` is derived inside the context rather than stored:

`context/SunnahContext.tsx:290-293`

```tsx
  const currentSunnah =
    currentSunnahId && !accomplishedIds.includes(currentSunnahId)
      ? SUNNAHS.find((s) => s.id === currentSunnahId) ?? null
      : null;
```

The `!accomplishedIds.includes(...)` guard means a stale or corrupted `currentSunnahId` that points at an already-completed Sunnah resolves to `null` and lands the user on the completion state rather than showing a Sunnah they have already finished. `Array.find` returning `undefined` is coalesced to `null` for the same reason: an ID removed from the catalog cannot crash the screen.

## Three render branches

The screen returns early three times, in this order:

1. `isLoading` → `PaperBackground` wrapping a centred `ActivityIndicator` in `palette.warmGold`.
2. `!currentSunnah` → the "all done" state, with `assets/images/app-icon.png` at 80% opacity. Note that `StreakCompleteModal` is still rendered in this branch, because completing the *last* Sunnah transitions to this state on the same tick that the celebration fires.
3. Otherwise, the full card.

## Hadith truncation

`screens/ActiveSunnah/index.tsx:30-37`

```tsx
const HADITH_CHAR_LIMIT = 120;

function getTruncatedHadith(text: string, limit: number): string {
	if (text.length <= limit) return text;
	const sliced = text.slice(0, limit);
	const lastSpace = sliced.lastIndexOf(" ");
	return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced) + "...";
}
```

The `lastSpace > 20` condition is a guard against a pathological case: if the first word boundary in the slice is very early (or absent), backing up to it would leave an unreadably short fragment, so the raw character cut is preferred instead. Truncation is character-based rather than measured, so the exact visual length varies with the Arabic glyphs involved — acceptable, since the goal is only to keep the card from dominating the scroll.

Expansion state resets on Sunnah change:

`screens/ActiveSunnah/index.tsx:69-71`

```tsx
	useEffect(() => {
		setHadithExpanded(false);
	}, [currentSunnah?.id]);
```

Both the `Text` element's `onPress` and the separate `TouchableOpacity` toggle the same state; the `Text` handler is gated on `isLongHadith` so that a short hadith is not a silently dead touch target.

## Haptics on mark-done

`handleMarkDone` fires feedback *before* dispatching, so the tactile response is not queued behind a React re-render and a storage write:

`screens/ActiveSunnah/index.tsx:104-113`

```tsx
		try {
			if (Platform.OS === "ios") {
				void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} else {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
				Vibration.vibrate(80);
			}
		} catch {
			Vibration.vibrate(80);
		}
```

iOS gets the semantic *success* notification pattern. Android gets a heavy impact plus an explicit 80 ms `Vibration`, because `expo-haptics` impact styles are noticeably weak on many Android devices. The `catch` falls back to raw vibration on devices where the haptics module throws.

`completingStreak` and `completedTitle` are captured **before** calling `markDoneToday()`, because that call replaces `currentSunnah` synchronously on the next render and the title would otherwise already be the *next* Sunnah's.

## Card structure

`variant="home"` in `components/ui/Card.tsx` is a layered construction rather than a single styled view:

- An absolutely positioned background layer holds the parchment fill and the two corner decoration images, with `overflow-hidden` so the images are clipped to the rounded corners.
- A floating gold badge sits at `-top-7`, outside the card's own bounds, holding a `flower-tulip` icon. This is why the card carries `mt-7`: it reserves room for the badge to overhang.
- The content sits in an inset view with a thin `goldAccent/50` border and `min-h-[200px]`, so short Sunnahs still produce a card of respectable proportions.

The card is `React.forwardRef` and sets `collapsable={false}` because the onboarding tour must measure it. See the next section.

## Onboarding integration

The screen registers five spotlight targets and two callbacks that the tour needs:

`screens/ActiveSunnah/index.tsx:52-57`

```tsx
	const { registerScroller, setHomeReady } = useOnboarding();
	const cardRef = useTourTarget("card");
	const streakDotsRef = useTourTarget("streakDots");
	const markDoneRef = useTourTarget("markDone");
	const alreadyDoingRef = useTourTarget("alreadyDoing");
	const skipRef = useTourTarget("skip");
```

Two non-obvious accommodations exist purely for the tour:

- **`removeClippedSubviews={false}` on the `ScrollView`.** Android detaches off-screen children from the native view hierarchy by default, and a detached view cannot be measured. The tour has to measure a target that is still below the fold in order to compute how far to scroll to it.
- **`scrollOffsetRef` is written on command, not on scroll.** `onScroll` lags an animated scroll by several frames, and the tour derives its next scroll from the last commanded value:

`screens/ActiveSunnah/index.tsx:75-78`

```tsx
	const scrollTourTo = useCallback((y: number) => {
		scrollOffsetRef.current = y;
		scrollRef.current?.scrollTo({ y, animated: true });
	}, []);
```

`setHomeReady(!isLoading && !!currentSunnah)` gates the tour's auto-start: the tour is meaningless until the real card and controls are laid out. The cleanup sets it back to `false` on unmount.

See [onboarding-tour.md](./onboarding-tour.md) for the measurement machinery on the other side of these hooks.

## Layout and safe areas

The screen does not use a `SafeAreaView`; it reads `useSafeAreaInsets()` and applies `insets.top` manually to the `ScrollView`'s content container, because the paper background must extend under the status bar. Bottom padding is a hardcoded `pb-[100px]` to clear the absolutely positioned tab bar.

When the broken-streak banner is visible, the banner takes the top inset and the scroll content drops to a flat `12` — otherwise both would apply the inset and produce a double gap.

## Accessibility

The two secondary buttons carry explicit `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint`, since their Arabic labels alone ("أفعلها بالفعل", "تخطي") do not convey that they advance to a different Sunnah. The read-more toggle's label changes with state.

## Extending this screen

- **Adding a field to the card** (e.g. a category chip) means adding it to the `Sunnah` interface in `types/index.ts`, filling it for all ten entries in `constants/data.ts`, and rendering it conditionally — every optional field on the card is already guarded with `&&` so partially populated entries degrade gracefully.
- **Changing the truncation limit** only needs `HADITH_CHAR_LIMIT`; `isLongHadith` and the toggle both derive from it.
- **Do not** move progress state into this screen. The notification rescheduling effect in `SunnahContext` depends on being the single writer.
