# Onboarding Spotlight Tour

A seven-step guided tour that runs once on first launch, dimming the screen and spotlighting one element at a time. It is by some margin the most intricate feature in the app, almost entirely because of coordinate-space problems in a forced-RTL, edge-to-edge React Native layout.

---

# Part 1 — User Guide

## When it appears

The first time you open Sunan, once the home tab has finished loading, the screen dims and a short tour begins. It runs once. You can replay it any time from **الإعدادات → إعادة عرض الشرح**.

## The seven steps

1. **مرحباً بك في سنن** — a centred welcome with no highlight: «سنة واحدة في كل مرة، حتى تصبح عادة.»
2. **هذه سنة اليوم** — highlights the card and explains its four parts: title, action, hadith, reward.
3. **النقاط السبع** — highlights the seven dots and explains the seven-consecutive-days rule.
4. **زر «فعلتها اليوم»** — highlights the primary button.
5. **«أفعلها بالفعل»** — explains the shortcut for habits you already keep.
6. **«تخطي»** — explains postponing a Sunnah.
7. **بقية الأقسام** — highlights the tab bar and introduces the other two tabs.

## Moving through it

The highlighted element is ringed in gold; everything else is dimmed.

- **التالي** advances. On the last step it reads **ابدأ**.
- **Tapping anywhere** on the dimmed area also advances.
- The **arrow button** goes back a step. It is hidden on the first step.
- **تخطي الشرح** ends the tour immediately and it will not return on its own.

Small dots at the bottom of the tooltip show which step you are on.

If a step's target is below the fold, the app scrolls it into view for you before highlighting it. The tooltip positions itself above or below the highlight depending on where there is room.

## Note

The tour explains the interface, not the content. It never touches your data — advancing through it does not mark anything done or skip anything.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `context/OnboardingContext.tsx` | Tour state machine, measurement, calibration, auto-scroll |
| `components/onboarding/steps.ts` | Step definitions and the `TourTargetKey` union |
| `components/onboarding/SpotlightOverlay.tsx` | Dim panels, gold ring, tooltip positioning |
| `components/onboarding/TourTarget.tsx` | `useTourTarget` hook and `TourTarget` wrapper |
| `components/onboarding/TourOriginProbe.tsx` | Two invisible calibration probes |
| `app/_layout.tsx` | Mounts the provider, probe, and overlay |
| `screens/ActiveSunnah/index.tsx` | Registers five targets, the scroller, and readiness |

## Why this is hard

A spotlight overlay needs one thing: the on-screen rectangle of an arbitrary element, in the coordinate space where the overlay draws. React Native makes that surprisingly difficult here, for four independent reasons:

1. **`measureInWindow` and the overlay do not share an origin.** On Android it reports coordinates relative to the *visible window frame*, which excludes the status bar, while the overlay lives in the edge-to-edge root view.
2. **RTL mirrors `left`.** With `I18nManager.forceRTL(true)`, React Native resolves the `left` inset against the layout's *start* edge, so an absolutely positioned view asking for `left: 0` lands on the physical right.
3. **Targets may be off-screen**, and Android detaches off-screen children from the native hierarchy, making them unmeasurable.
4. **Scroll animations are asynchronous** and measuring mid-flight returns where the target *was*.

The implementation solves each empirically — by measuring probes whose intended position is known — rather than by deriving from platform flags, so no assumption can silently go stale across an SDK upgrade.

## Mounting

The overlay is a **sibling of the `Stack`**, not a `Modal`:

`app/_layout.tsx:144-150`

```tsx
          <View className="flex-1">
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <TourOriginProbe />
            <SpotlightOverlay />
          </View>
```

A `Modal` would be a separate native window with its own coordinate space, and on Android it could not dim the tab bar. Being a sibling means the overlay shares a coordinate origin with `TourOriginProbe`, which is the whole basis of calibration.

## Step definitions

`components/onboarding/steps.ts:9-17`

```ts
export interface OnboardingStep {
	id: string;
	/** Omit to show a centered tooltip with no spotlight. */
	targetKey?: TourTargetKey;
	title: string;
	body: string;
	/** Extra breathing room around the highlighted element, in points. */
	padding?: number;
}
```

`ONBOARDING_STEPS` is a plain array; `totalSteps` and `isLastStep` derive from its length, so adding a step is a single edit. An omitted `targetKey` yields a centred tooltip with no hole — used by the welcome step.

Per-step `padding` values vary from 4 (the card, which already has generous internal padding) to 10 (the dots and small buttons, which need visual breathing room).

## Target registration

`useTourTarget` returns a **callback ref**, attached directly to the element being explained:

`components/onboarding/TourTarget.tsx:14-23`

```tsx
export function useTourTarget(tourKey: TourTargetKey) {
	const { registerTarget } = useOnboarding();

	return useCallback(
		(node: TourMeasurable | null) => {
			registerTarget(tourKey, node);
		},
		[registerTarget, tourKey],
	);
}
```

The comment in the source explains the choice: attaching the ref to the element itself rather than wrapping it in a `View` means the measured frame is what the user actually sees. A wrapper would swallow the child's margins and produce a spotlight offset from the element.

Every registered target sets `collapsable={false}`. Android's view flattening optimisation removes layout-only views from the native hierarchy, and a flattened view cannot be measured — this is why `Card`, `StreakDots`, and the button wrappers all carry the prop.

Targets are held in a `useRef(new Map())`, not state. Registration happens during commit and must not trigger a re-render.

The `TourTarget` wrapper component exists for elements that cannot take a ref, but nothing currently needs it.

## Calibration

`TourOriginProbe` renders two invisible views, both `collapsable={false}`:

- The **outer probe** fills the overlay's coordinate space. Measuring it reveals where the overlay's origin sits in `measureInWindow` space — typically `y = statusBarHeight` on Android, `0` on iOS.
- The **inner marker** asks for `position: absolute; top: 0; left: 0; width: 8`. Measuring where it *actually* landed reveals whether `left` was mirrored.

`context/OnboardingContext.tsx:240-258`

```tsx
	const refreshCalibration = useCallback(async () => {
		const probe = originProbeRef.current;
		if (!probe) return;

		const originRect = await measureInWindowAsync(probe);
		if (!originRect) return;
		originRef.current = { x: originRect.x, y: originRect.y };

		const marker = mirrorMarkerRef.current;
		if (!marker) return;

		const markerRect = await measureInWindowAsync(marker);
		if (!markerRect) return;

		// The marker asked for left: 0. Landing on the far side means React
		// Native rewrote `left` to the layout's start edge.
		const markerOffset = markerRect.x - originRect.x;
		setMirrorsLeft(markerOffset > originRect.width / 2);
	}, []);
```

The marker is 8 pt wide specifically so that a mirrored result lands unmistakably far from `x = 0` — the `> width / 2` test then has an enormous margin and cannot be confused by sub-pixel noise.

`mirrorsLeft` is *seeded* from `I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL` so the first frame is usually right, then corrected by observation. Calibration re-runs on every step, so a rotation or window resize between steps cannot leave a stale origin.

## Measurement

`measureInWindowAsync` wraps the callback API and resolves `null` on failure:

`context/OnboardingContext.tsx:101-122`

```tsx
function measureInWindowAsync(node: TourMeasurable): Promise<TourRect | null> {
	return new Promise((resolve) => {
		let settled = false;
		const done = (rect: TourRect | null) => {
			if (settled) return;
			settled = true;
			resolve(rect);
		};

		const timer = setTimeout(() => done(null), MEASURE_TIMEOUT);

		try {
			node.measureInWindow((x, y, width, height) => {
				clearTimeout(timer);
				done(width > 0 && height > 0 ? { x, y, width, height } : null);
			});
		} catch {
			clearTimeout(timer);
			done(null);
		}
	});
}
```

Three failure modes are covered: `measureInWindow` never invoking its callback (the 400 ms timeout), reporting a zero-sized frame because the node is still laying out or already unmounted (the `width > 0 && height > 0` test), and throwing outright. The `settled` flag prevents a late callback from double-resolving.

Three layers sit on top:

- **`resolveRect`** retries up to five times at 120 ms intervals, re-reading the node from the map each attempt (a re-render may have replaced it), and subtracts the calibrated origin to convert into overlay space.
- **`resolveSettledRect`** polls until two consecutive readings agree within 1 pt, up to twelve times at 80 ms. This is the defence against measuring during a scroll animation.
- **`measureStep`** orchestrates: bump the staleness token, handle the no-target and tab-bar special cases, calibrate, settle, then auto-scroll.

### Staleness tokens

`context/OnboardingContext.tsx:318-320`

```tsx
			measureTokenRef.current += 1;
			const token = measureTokenRef.current;
			const isStale = () => token !== measureTokenRef.current;
```

A full measurement can take over a second across all its retries and polls. The user can advance several steps in that time. Every `await` boundary in `measureStep` is followed by an `isStale()` check that abandons the work, so an in-flight measurement for step 3 cannot overwrite `targetRect` after the user has reached step 5. The token is also bumped by `startTour` and `finishTour`.

### The tab bar exception

`context/OnboardingContext.tsx:329-338`

```tsx
			if (step.targetKey === "tabBar") {
				const bounds = boundsRef.current;
				setTargetRect({
					x: 0,
					y: bounds.windowHeight - bounds.tabBarHeight,
					width: bounds.windowWidth,
					height: bounds.tabBarHeight,
				});
				return;
			}
```

The tab bar lives inside the navigator and there is no clean way to attach a ref to it, so its rectangle is *computed* from geometry duplicated from the tabs layout:

`context/OnboardingContext.tsx:20-22`

```tsx
/** Mirrors the tabBarStyle height in app/(tabs)/_layout.tsx */
const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_MIN_INSET = 10;
```

This is the one piece of genuine duplication in the feature. `tabBarHeight = 60 + Math.max(insets.bottom, 10)` must stay in sync with `app/(tabs)/_layout.tsx`; changing the tab bar height there without updating here will misplace the final step's spotlight.

## Auto-scrolling

The home screen registers a scroller through `registerScroller`. `measureStep` then iterates up to three passes:

`context/OnboardingContext.tsx:351-371`

```tsx
				for (let pass = 0; pass < SCROLL_PASSES; pass++) {
					const delta = scrollDeltaFor(rect, boundsRef.current);
					if (Math.abs(delta) <= SCROLL_EPSILON) break;

					const from = scroller.getOffset();
					const to = Math.max(0, from + delta);
					if (Math.abs(to - from) <= SCROLL_EPSILON) break;

					scroller.scrollTo(to);
					await wait(SCROLL_START_DELAY);
					if (isStale()) return;

					const measured = await resolveSettledRect(step.targetKey, isStale);
					if (isStale()) return;
					if (!measured) break;

					const moved = Math.abs(measured.y - rect.y) > SCROLL_EPSILON;
					rect = measured;
					// The scroller hit an end and cannot get any closer.
					if (!moved) break;
				}
```

Iteration rather than a single computed scroll, because the reported offset can lag and the scroller can clamp at either end. The `moved` check is the termination condition for the clamped case — if a scroll produced no movement, further passes are futile.

`scrollDeltaFor` computes the minimum scroll to bring the rectangle inside the safe band (below the top inset, above the tab bar). A target taller than the band is aligned to the top instead of centred, since it cannot fit.

## Auto-start

`context/OnboardingContext.tsx:423-427`

```tsx
	useEffect(() => {
		if (hasSeenOnboarding !== false || !homeReady || isActive) return;
		const timer = setTimeout(startTour, AUTO_START_DELAY);
		return () => clearTimeout(timer);
	}, [hasSeenOnboarding, homeReady, isActive, startTour]);
```

Note `hasSeenOnboarding !== false` — the flag is tri-state (`null` while the storage read is pending), and the strict comparison ensures the tour never starts before the flag is known. `homeReady` is set by the home screen once loading is done and a Sunnah exists. The 700 ms delay lets the screen settle after the splash hides.

An unreadable flag is treated as **seen**:

`context/OnboardingContext.tsx:199-204`

```tsx
			} catch (error) {
				// Treat an unreadable flag as "seen" so a storage failure cannot
				// trap the user in a tour we are unable to dismiss permanently.
				console.warn("Failed to read onboarding flag", error);
				setHasSeenOnboarding(true);
			}
```

The failure mode being avoided is severe: if storage is broken, a tour that auto-starts and cannot persist its dismissal would replay on every launch forever.

## Overlay rendering

### Four dim panels, not a mask

There is no SVG mask or `BlurView` cut-out. Four absolutely positioned `Animated.View`s at `rgba(0,0,0,0.62)` surround the hole, plus a separate gold-bordered ring view. The hole is described by four shared values (`holeX/Y/Width/Height`) animated with `withTiming` over 260 ms.

The mirroring correction is inlined into each animated style rather than factored out, and the source explains why:

`components/onboarding/SpotlightOverlay.tsx:67-73`

```tsx
	/**
	 * Measured geometry is physical, but React Native resolves `left` against
	 * the layout's start edge in this RTL app, which mirrors absolute positions.
	 * The conversion is inlined into each animated style below because only
	 * plain values from component scope cross reliably onto the UI thread.
	 */
	const mirror = mirrorsLeft;
```

Only the left and right panels and the ring need the correction; the top and bottom panels are full-width and therefore symmetric under mirroring.

For a step with no target, the hole collapses to a zero-sized point at the screen centre, which makes the four panels tile the entire screen — no special-case rendering needed. `hasAnimatedRef` makes the first step snap into place rather than animating in from the centre.

### Tooltip positioning

This contains the subtlest bug fix in the codebase. The tooltip is anchored to one edge of the safe band with a margin that **never refers to its own height**:

`components/onboarding/SpotlightOverlay.tsx:202-207`

```tsx
	// The tooltip is anchored to one edge of the safe band by an inset that
	// never refers to its own height. Deriving the position from the measured
	// height instead makes onLayout feed back into the layout it just measured,
	// which oscillates: Android rounds a view's height off its rounded top and
	// bottom edges, so moving the tooltip can flip the reported height by a
	// pixel, which moves it again. The height only picks the anchor here.
```

The measured height is used *only* to choose between three anchors — below the target, above it, or overlapping it — while the actual offset is computed from the target's geometry and the band edges. `handleTooltipLayout` additionally rounds and applies a 1 pt dead zone before accepting a new height.

The overlapping case, for a target too tall to clear on either side, covers the end furthest from the target's start so the heading the tooltip is describing stays visible.

The tooltip is remounted per step via `key={step.id}` with a `FadeIn`, which hides the reposition that follows measuring the new step's height.

### Tap-to-advance

A full-screen `Pressable` calling `next` sits beneath the panels, marked `accessible={false}` and `importantForAccessibility="no"` so assistive technology uses the labelled tooltip buttons instead. The dim panels are `pointerEvents="none"` so taps reach it; the tooltip band is `pointerEvents="box-none"` so taps outside the tooltip fall through.

The back button uses `chevron-forward` — correct in RTL, where "back" points right.

## Persistence

One key, `@sonan_onboarding_v1`, holding the literal string `"done"`. Written by `finishTour`, which is also the last-step handler for `next`. Deliberately **not** cleared by reset — see [settings.md](./settings.md).

## Guard rails

`next`, `back`, and `finishTour` all check `isActiveRef.current` before acting, and read `stepIndexRef` rather than state:

`context/OnboardingContext.tsx:168-173`

```tsx
	// Mirrors of state so the step callbacks stay referentially stable and can
	// never act on a tour that is no longer running.
	const stepIndexRef = useRef(0);
	stepIndexRef.current = stepIndex;
	const isActiveRef = useRef(false);
	isActiveRef.current = isActive;
```

This keeps the callbacks referentially stable (empty or minimal dependency arrays) while remaining correct, which matters because they are passed to the overlay's `Pressable` and buttons on every step.

## Gotchas when modifying

- **Adding a target** means adding to the `TourTargetKey` union, attaching `useTourTarget` plus `collapsable={false}` to the element, and adding the step. If the target is on a screen other than the home tab, the auto-start gating and the `registerScroller` contract will both need rethinking — both currently assume the home tab.
- **Changing the tab bar height** requires updating `TAB_BAR_BASE_HEIGHT` in the onboarding context.
- **The timing constants** at the top of `OnboardingContext.tsx` are tuned against real devices. Reducing `MEASURE_RETRY_DELAY` or `SETTLE_POLL_INTERVAL` risks measuring mid-animation on slower hardware.
- **`removeClippedSubviews={false}`** on the home `ScrollView` is required by this feature. Removing it breaks measurement of below-the-fold targets on Android.
