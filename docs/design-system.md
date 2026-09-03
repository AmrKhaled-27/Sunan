# Design System

The "warm manuscript" visual language: a parchment palette, two Arabic typefaces, layered paper textures, and five shared components.

---

# Part 1 — User Guide

## The look

Sunan is meant to feel like a page from a manuscript rather than a productivity app. Everything sits on a warm parchment background with a subtle paper texture and pale foliage in two corners. Accents are muted gold; text is a soft dark brown rather than black; the primary action is a dusty olive green.

## Typography

Two Arabic typefaces, each with a job:

- **Amiri**, a classical naskh serif, is used for the words of the hadith and for Sunnah titles on the card. It is the voice of the text being quoted.
- **Tajawal**, a clean modern sans, is used for everything else — headings, buttons, descriptions, settings. It is the voice of the app.

The visual contrast between them is what tells you at a glance which words are the app's and which are the narration's.

## Right to left

The whole app is right-to-left. Headings are centred, lists read from the right, and the back arrow in the tour points right, because that is the direction "back" runs in Arabic.

## The card

The Sunnah card is the centrepiece: a pale parchment panel with an inner gold-bordered frame, decorative flourishes bleeding off two corners, and a circular gold badge with a tulip motif overhanging the top edge.

## Motion and feedback

Motion is restrained and always tied to something you did. Buttons dip slightly when pressed and spring back. Tapping a tab gives a light haptic tick on iPhone. Marking a day done vibrates. Completing seven days is the one moment the app allows itself to be loud: gold and green confetti across the screen.

## Colour is never the only signal

Where a state matters, something other than colour carries it too. Today's streak dot is larger as well as outlined. Completed days show a check mark, not just a fill. Disabled buttons change their text. Achievement cards carry a written label for how the Sunnah was completed.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `constants/theme.js` | The palette and font family tokens |
| `constants/theme.d.ts` | Hand-written types for the above |
| `tailwind.config.js` | Feeds the tokens into NativeWind |
| `global.css` | Tailwind directives |
| `components/ui/Button.tsx` | Gradient / ghost button |
| `components/ui/Card.tsx` | `default` and `home` card variants |
| `components/ui/ConfirmModal.tsx` | Shared confirmation dialog |
| `components/ui/PaperBackground.tsx` | Texture and foliage layers |
| `components/ui/HapticTab.tsx` | Tab bar button with haptics |
| `components/ui/index.ts` | Barrel export |

## Tokens as a JavaScript module

`constants/theme.js` is deliberately **`.js`, not `.ts`**, and uses `module.exports`. `tailwind.config.js` is evaluated by the Tailwind CLI in a plain Node context that cannot consume TypeScript:

`tailwind.config.js:1-1`

```js
const { palette, fonts } = require("./constants/theme");
```

Type safety is recovered with a hand-written `constants/theme.d.ts` that declares each colour as a **literal type** (`readonly warmGold: "#C4A46C"`). That gives autocomplete and catches typos in TypeScript consumers, at the cost of needing to be updated by hand alongside the `.js`. Adding a colour in one file and not the other is the failure mode to watch for.

The tokens then flow into NativeWind by extension, so every palette key is available as a utility class:

`tailwind.config.js:12-17`

```js
  theme: {
    extend: {
      colors: palette,
      fontFamily: fonts,
    },
  },
```

`extend` rather than replace, so Tailwind's own scale (`red-100`, `black/40`, spacing, radii) stays available — the app uses `bg-red-100` and `border-red-300` for the broken-streak banner and `bg-black/40` for modal backdrops rather than adding tokens for one-offs.

The `content` globs cover `app`, `components`, `screens`, and `context`. A `className` written in `utils` or `services` would not be compiled — not currently an issue, but a trap.

## The palette

Twenty-six colours in `constants/theme.js`, grouped by role:

| Group | Keys | Use |
| --- | --- | --- |
| Parchment | `parchment`, `parchmentLight`, `parchmentPure` | Backgrounds, in increasing lightness |
| Brown | `warmBrown`, `warmBrownLight`, `warmBrownMuted`, `warmBrownSubtle` | Text, in decreasing emphasis |
| Gold | `warmGold`, `warmGoldLight`, `warmGoldMuted`, `goldAccent` | Accents, borders, active states |
| Green | `oliveGreen`, `oliveGreenDark`, `sageGreen`, `sageGreenLight` | Primary action, confetti |
| Amber / muted gold | `warmAmber`, `warmAmberLight`, `mutedGold`, `mutedGoldLight` | Confetti; largely unused elsewhere |
| Semantic | `tabInactive`, `switchTrackFalse`, `danger`, `dangerDark`, `dangerLight` | Specific controls |
| Neutral | `white`, `black` | — |

The three-step parchment scale is what makes the layering read: `parchment` is the screen, `parchmentLight` is a surface on it (cards in settings and achievements, modals, the tab bar), and `parchmentPure` is the elevated Sunnah card.

The four-step brown scale is the type hierarchy — `warmBrown` for headings and primary text, `warmBrownLight` for body and descriptions, `warmBrownMuted` and `warmBrownSubtle` for de-emphasised text and the skip button's gradient.

Opacity modifiers do most of the work rather than additional tokens: `warmGold/10` for tinted fills, `warmGold/15` for secondary buttons, `warmGold/30` for borders, `warmGold/20` for card outlines. This is why the palette has stayed small.

`dangerLight` and several of the amber/muted-gold entries are currently unreferenced outside the confetti colour array.

## Typography

`constants/theme.js:31-39`

```js
const fonts = {
  sans: ["Tajawal_400Regular", "sans-serif"],
  tajawal: ["Tajawal_400Regular", "sans-serif"],
  tajawalBold: ["Tajawal_700Bold", "sans-serif"],
  "tajawal-bold": ["Tajawal_700Bold", "sans-serif"],
  amiri: ["Amiri_400Regular", "serif"],
  amiriBold: ["Amiri_700Bold", "serif"],
  "amiri-bold": ["Amiri_700Bold", "serif"],
};
```

Each family is aliased twice — camelCase and kebab-case — because the two are consumed differently. NativeWind generates classes from the keys, so `font-tajawal-bold` requires the kebab key; JavaScript consumers that need a raw family name index the camelCase key, as `app/(tabs)/_layout.tsx` does with `fonts.tajawalBold[0]` for `tabBarLabelStyle`. `sans` is aliased to Tajawal so any un-prefixed default resolves to the app's sans rather than the system font.

Four faces are loaded — regular and bold of each family — from `@expo-google-fonts/amiri` and `@expo-google-fonts/tajawal` via `useFonts` in the root layout. There are no italic or intermediate weights, so `font-semibold` and similar Tailwind weight utilities have no effect.

### Line height is always explicit

Arabic script with diacritics needs far more leading than Latin defaults provide, and ascender/descender-based auto line height clips marks. Every multi-line text in the app sets it explicitly, often generously: `leading-[44px]` for the 28 pt card title, `leading-[32px]` for the hadith, `leading-8` for body copy. When adding text, set line height deliberately rather than relying on the default.

## Layered backgrounds

`PaperBackground` wraps every screen and composes three layers:

1. A `bg-parchment` fill.
2. The paper texture (`assets/images/paper-background.webp`) at 60% opacity, `contentFit="cover"`, filling absolutely.
3. A `pointerEvents="none"` layer holding two foliage PNGs positioned with negative offsets so they bleed off the top-left and bottom-right corners.

All three images use `expo-image` rather than React Native's `Image`, with `cachePolicy="memory-disk"` and `priority="high"` on the texture. The texture is on screen for the entire session and is re-mounted on every tab switch; `expo-image`'s persistent cache avoids re-decoding it each time. WebP for the texture (a large, photographic tile) and PNG for the decorations (which need alpha and are small).

The `pointerEvents="none"` on the decoration layer is essential — it spans the screen and would otherwise swallow every touch.

Note that all three screens wrap themselves in `PaperBackground` individually rather than it living in the layout. That means the texture unmounts and remounts on tab change; the cache makes this cheap, and it keeps each screen self-contained.

## Button

One component, two variants.

**Solid** is a three-layer construction: an `Animated.View` carrying the press transform and shadow, a `LinearGradient` inside it, and the label. The gradient runs diagonally from `color` to `colorEnd`, falling back to a flat fill when `colorEnd` is omitted. The outer view keeps a `backgroundColor` matching `color` so there is no flash before the gradient renders.

The tactile detail is `border-b-[3px] border-b-black/20` — a thicker, darkened bottom border that reads as physical depth, paired with the press scale.

**Ghost** drops the gradient for a `1.5px` border in `color` over `bg-white/40`, and tints the label with `color` instead of `textColor`. Used for the cancel action in `ConfirmModal`.

Press feedback uses the **legacy `Animated` API**, not Reanimated:

`components/ui/Button.tsx:41-48`

```tsx
	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.96,
			useNativeDriver: true,
			speed: 50,
			bounciness: 0,
		}).start();
	};
```

Asymmetric on purpose: press-in is fast and flat (`speed: 50, bounciness: 0`) so it feels immediate; release is slower with a bounce (`speed: 20, bounciness: 10`) so it feels springy. `useNativeDriver: true` keeps it off the JS thread. Reanimated is reserved for the onboarding overlay and confetti, where worklet-driven animation is actually required.

Both `LinearGradient` and `Animated.View` need `cssInterop` registration to accept `className`:

`components/ui/Button.tsx:7-8`

```tsx
cssInterop(LinearGradient, { className: "style" });
cssInterop(Animated.View, { className: "style" });
```

Any third-party component given a `className` needs this; without it the prop is silently ignored.

Accessibility is built in: `accessibilityRole="button"`, a label defaulting to `title`, an optional hint, and `accessibilityState={{ disabled }}`. Disabled also drops opacity to 0.5.

Note the component hardcodes `mb-3 w-full`, so it always occupies a full-width block with a bottom margin. Callers wanting a different footprint must wrap it.

## Card

**`variant="default"`** is a straightforward surface: a rounded panel with a 3 pt accent line along the top and two L-shaped corner ornaments drawn with borders. Currently unused by any screen — it is available, and `accentColor` / `color` are parameterised for it.

**`variant="home"`** is the layered construction described in [daily-sunnah.md](./daily-sunnah.md): an absolutely positioned background layer with `overflow-hidden` so the decoration images clip to the rounded corners, a badge overhanging the top edge at `-top-7` with `z-20`, and content in an inset frame with a `min-h-[200px]` floor.

Both variants are `forwardRef` with `collapsable={false}` so the onboarding tour can measure them.

The `mt-7` on the home variant reserves space for the overhanging badge. Removing it clips the badge on Android, where a child cannot paint outside a parent that establishes a clipping context.

## ConfirmModal

The shared shell for all four confirmations (already-doing, skip, reset, and any future one). It supplies the `bg-black/40` backdrop, the centred parchment card, a solid confirm `Button`, and a ghost cancel `Button` defaulting to «رجوع».

The confirm gradient is the only visual variable, and it is used semantically: olive green for a positive commitment, muted brown for skip (deliberately unappealing), red for destructive. See [sunnah-rotation.md](./sunnah-rotation.md) and [settings.md](./settings.md).

It uses a real React Native `Modal` with `transparent animationType="fade"`. That is fine here because the content fits inside the dialog's bounds — unlike `StreakCompleteModal`, whose confetti must overflow and therefore cannot use `Modal` at all. The distinction is explained in [streak-tracking.md](./streak-tracking.md).

There is no backdrop-tap-to-dismiss and no `onRequestClose`, so the Android back button does not close these dialogs. Worth noting given `predictiveBackGestureEnabled: false` in `app.json`.

## HapticTab

Wraps `PlatformPressable` from `@react-navigation/elements` and adds a light impact on press-in, gated on `process.env.EXPO_OS === "ios"`. The env check is compile-time-inlined by Babel, so the Android bundle drops the branch entirely — cheaper than a runtime `Platform.OS` test. iOS-only because Android's tab-press feedback is already handled by the platform's own touch ripple.

## Styling conventions

**NativeWind for layout and static styling; `StyleSheet` for animation and absolute overlays.** The overlays (`SpotlightOverlay`, `StreakCompleteModal`) use `StyleSheet` because Reanimated worklets need plain values, and because `StyleSheet.absoluteFillObject` is clearer than the class equivalent.

**RTL spacing is written by hand.** `ml-4` / `mr-1` in `SettingRow`, `mr-1` on section headings. There are no logical (`ps-`/`pe-`) utilities in use, so these read as physical values under a forced-RTL layout. This is a consistency to maintain rather than a pattern to admire.

**Arabic strings are inline.** No i18n layer, no string constants file. The app is Arabic-only by design.

**`palette` is imported where a raw colour value is needed** — icon `color` props, `Switch` track colours, gradient endpoints, `ActivityIndicator`. Everything else uses classes.

## Adding to the system

- **A colour** goes in `constants/theme.js` *and* `constants/theme.d.ts`, then becomes available as a class after a Metro restart.
- **A font weight** needs the face added to `useFonts` in `app/_layout.tsx` and both alias forms in `fonts`.
- **A shared component** goes in `components/ui/` and should be added to `components/ui/index.ts`. If the tour might ever highlight it, make it `forwardRef` and set `collapsable={false}`.
- **Screen-specific components** belong in `screens/<Screen>/components/`, which is the existing convention — only genuinely shared primitives live in `components/ui/`.
