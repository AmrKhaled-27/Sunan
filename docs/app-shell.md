# App Shell

Everything that surrounds the features: boot sequence, RTL enforcement, provider hierarchy, routing, the tab bar, the error boundary, and build/release configuration.

---

# Part 1 — User Guide

## Starting the app

You see the splash screen — the app icon on a pale parchment field — while Sunan loads its Arabic typefaces and reads your saved progress. On a normal device this is brief. The splash hands over directly to your current Sunnah.

## The three tabs

A bar along the bottom, with a crescent, a trophy, and a cog:

- **سنة اليوم** — today's Sunnah. See [daily-sunnah.md](./daily-sunnah.md).
- **الانجازات** — what you have established. See [accomplishments.md](./accomplishments.md).
- **الإعدادات** — reminders and data. See [settings.md](./settings.md).

The active tab is gold; the others are a muted grey-brown. On iPhone, tapping a tab gives a light haptic tick.

The bar is translucent-edged and floats over the parchment background, which continues behind it.

## Orientation and appearance

Sunan is portrait-only. It works on tablets, and on Android it draws edge to edge, right up under the status bar and behind the navigation bar. There is no dark mode — the parchment palette is the only appearance.

## Right to left

The entire interface is right-to-left, regardless of your device's language setting. Sunan is an Arabic-only app.

## If something goes wrong

An unexpected error shows a warning symbol and **«حدث خطأ غير متوقع»** with **«نعتذر عن هذا الخطأ. يمكنك إعادة المحاولة للمتابعة.»** and a gold **إعادة المحاولة** button. Tapping it retries without closing the app. Your saved progress is not affected — it is on disk, not in the screen that failed.

## Updates

Sunan can receive small improvements over the air, without a visit to the app store. Larger changes still require a normal store update.

---

# Part 2 — Technical Deep Dive

## Files

| Path | Role |
| --- | --- |
| `app/_layout.tsx` | Root layout: RTL, fonts, splash, providers, error boundary, notification taps |
| `app/(tabs)/_layout.tsx` | Tab navigator configuration |
| `app/(tabs)/index.tsx`, `accomplished.tsx`, `settings.tsx` | Route files |
| `app.json` | Expo config |
| `eas.json` | Build profiles and update channels |
| `package.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json` | Toolchain |
| `hooks/useSunnah.ts` | Re-export shim |

Expo SDK **~54.0.34**, React Native **0.81.5**, React **19.1.0**, New Architecture enabled. Expo's APIs change between SDK versions — check <https://docs.expo.dev/versions/v54.0.0/> before touching anything here.

## Module-scope side effects

Three things run when `app/_layout.tsx` is first imported, before any component renders:

`app/_layout.tsx:35-43`

```tsx
// Set native window background to parchmentLight matching the nav bar
SystemUI.setBackgroundColorAsync(palette.parchmentLight);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
```

Each has to be at module scope rather than in an effect:

- **`SystemUI.setBackgroundColorAsync`** sets the *native* window background. Without it, the flash between the splash disappearing and the first React frame is the platform default white, which is jarring against parchment. It also fills the area behind the transparent Android navigation bar.
- **`SplashScreen.preventAutoHideAsync`** must be called before the splash would otherwise auto-hide, which happens as soon as the first frame renders — an effect is too late.
- **`I18nManager.forceRTL`** must be set before the first layout pass. Called later, it would require a reload to take effect.

`forceRTL(true)` is unconditional: the app is Arabic-only and must be RTL even on an English device. The consequence is that `left`/`right` styles are resolved against start/end edges throughout, which is the root cause of the mirroring complexity in [onboarding-tour.md](./onboarding-tour.md).

Importing this file also transitively runs `Notifications.setNotificationHandler` from `services/notifications.ts`. See [notifications.md](./notifications.md).

## Boot sequence

1. Module side effects above.
2. `useFonts` loads four faces: `Amiri_400Regular`, `Amiri_700Bold`, `Tajawal_400Regular`, `Tajawal_700Bold`.
3. While `!fontsLoaded`, the component returns a bare `ActivityIndicator` on `bg-parchment` — providers are **not** mounted yet.
4. Once loaded: hide the splash, request notification permission.
5. Providers mount; `SunnahProvider`'s init effect runs Android channels, then state load, then prayer times, sequentially.
6. `ActiveSunnahScreen` shows its own spinner while `isLoading`, then the card.

Two loading states in sequence (font spinner, then screen spinner) is a consequence of the early return, and both are normally imperceptible. The early return does mean `SunnahProvider` does not begin loading state until fonts resolve — the two could be parallelised, but the gain is marginal.

There is no `expo-font` `loadedError` handling; a font failure would leave the app on the spinner indefinitely.

## Provider hierarchy

`app/_layout.tsx:138-154`

```tsx
    <SunnahProvider>
      <OnboardingProvider>
        <ThemeProvider value={CustomTheme}>
          <View className="flex-1">
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <TourOriginProbe />
            <SpotlightOverlay />
          </View>
          <StatusBar style="dark" />
        </ThemeProvider>
      </OnboardingProvider>
    </SunnahProvider>
```

`SunnahProvider` is outermost because nothing it needs comes from the others. `OnboardingProvider` is nested inside it but does not actually consume it — the ordering is conventional, not required. They are separate contexts on purpose: onboarding state is transient UI state that changes rapidly during a tour, and merging it into `SunnahContext` would re-render every progress consumer on each tour step.

`ThemeProvider` from `@react-navigation/native` gets a `CustomTheme` that overrides only `colors.background` to `palette.parchment`, so the navigator's own container does not paint white behind screen transitions.

`StatusBar style="dark"` is unconditional — dark glyphs on parchment, with no light-mode variant.

The `View className="flex-1"` wrapper exists solely so the tour probe and overlay are siblings of the `Stack` sharing its coordinate space. Explained in [onboarding-tour.md](./onboarding-tour.md).

`SafeAreaProvider` is notably **absent** — it is installed automatically by Expo Router, and screens call `useSafeAreaInsets()` directly.

## Routing

Expo Router v6, file-based, with typed routes enabled (`experiments.typedRoutes`).

`app/_layout.tsx:69-71`

```tsx
export const unstable_settings = {
  anchor: "(tabs)",
};
```

`anchor` designates `(tabs)` as the root the stack always returns to, which is what makes `router.replace("/(tabs)")` from a notification tap behave predictably regardless of prior navigation state.

The route tree is minimal — one stack containing one tab group containing three screens. No dynamic routes, no nested stacks, no modal routes. Every dialog in the app is an in-screen `Modal` or absolute overlay rather than a route, which is why there is no `(modals)` group.

The three route files under `app/(tabs)/` are one-line re-exports of `screens/*`. The separation keeps the route tree readable and lets screens live in folders alongside their private components — `screens/<Screen>/components/` — which a file-based router cannot express, since every file under `app/` is a route.

`scheme: "sunan"` in `app.json` registers the deep-link scheme. Nothing currently parses a deep link path; the scheme exists for the notification tap path and for future use.

## Tab navigator

`app/(tabs)/_layout.tsx:18-30`

```tsx
        tabBarStyle: {
          position: "absolute",
          backgroundColor: palette.parchmentLight,
          borderTopWidth: 1,
          borderTopColor: "rgba(196, 164, 108, 0.2)",
          elevation: 5,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowColor: palette.black,
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
```

`position: "absolute"` lets the parchment background run underneath the bar. The cost is that it no longer occupies layout space, so **every screen must pad its own scroll content** to clear it — `pb-[100px]` on the home and settings screens, `pb-[90px]` on the achievements list. Forgetting that padding on a new screen hides its last item behind the bar.

`Math.max(insets.bottom, 10)` gives a floor for devices without a home indicator, where `insets.bottom` is 0 and the bar would otherwise be uncomfortably short.

**This height expression is duplicated** in `context/OnboardingContext.tsx` as `TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, TAB_BAR_MIN_INSET)`, because the tour cannot attach a ref to the navigator's bar and must compute its rectangle. The two must be changed together.

Icons are `Ionicons`, switching between filled and outline on focus (`moon`/`moon-outline`, `trophy`/`trophy-outline`, `settings`/`settings-outline`) so focus is signalled by shape as well as by the gold tint. Labels use `fonts.tajawalBold[0]` — the raw family string rather than a class, since `tabBarLabelStyle` is a style object.

`tabBarButton: HapticTab` adds iOS haptics. See [design-system.md](./design-system.md).

`headerShown: false` everywhere; each screen renders its own centred Arabic heading.

## Error boundary

Expo Router picks up a named `ErrorBoundary` export from a layout file automatically:

`app/_layout.tsx:45-67`

```tsx
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 justify-center items-center bg-parchment px-8">
      {/* ...Arabic error copy... */}
      <TouchableOpacity onPress={retry} /* ... */>
```

`retry` is supplied by the router and re-mounts the failed subtree rather than reloading the app, so persisted state is untouched. Because the boundary is exported from the **root** layout, it catches render errors anywhere in the tree — but it will not catch errors thrown in async callbacks or event handlers outside render, which is why the service layer catches its own errors instead of relying on this.

The copy is styled with `bg-parchment` and the app's typefaces, so a crash still looks like the app.

## Android edge-to-edge

`app/_layout.tsx:93-99`

```tsx
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setPositionAsync("absolute");
      NavigationBar.setBackgroundColorAsync("#00000000");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);
```

Paired with `edgeToEdgeEnabled: true` and `androidNavigationBar` in `app.json`. The `SystemUI` background colour set at module scope is what shows through the transparent bar. Button style is `dark` because the parchment behind it is light.

`predictiveBackGestureEnabled: false` — the app has no back-navigable stack to predict into, and none of the modals implement `onRequestClose`.

## Configuration reference

### `app.json` highlights

| Setting | Value | Note |
| --- | --- | --- |
| `name` / `slug` | `Sunan` / `sunan` | Display name is Latin; UI copy uses «سنن» |
| `version` | `1.0.0` | Duplicated in the settings footer string |
| `runtimeVersion.policy` | `appVersion` | Update compatibility is keyed to `version` |
| `updates.url` | `u.expo.dev/9321d380-…` | EAS Update endpoint |
| `orientation` | `portrait` | |
| `userInterfaceStyle` | `automatic` | Vestigial — there is no dark theme |
| `newArchEnabled` | `true` | Fabric / TurboModules |
| `ios.supportsTablet` | `true` | No tablet-specific layouts exist |
| `android.package` | `com.sunnah.sunan` | |
| `android.adaptiveIcon.backgroundColor` | `#00000000` | Transparent; the foreground image carries the whole icon |
| `experiments.typedRoutes` | `true` | Generates `expo-env.d.ts` |
| `experiments.reactCompiler` | `false` | Explicitly off |

Plugins: `expo-router`, `expo-splash-screen` (app icon at 200 pt on `#FAF7F0`, same colour for dark so the splash never inverts), and `expo-notifications` (accent `#C4A46C`).

Because `runtimeVersion.policy` is `appVersion`, an OTA update only reaches builds with a matching `version`. Bumping `version` without shipping a new binary orphans existing installs from further updates.

### `eas.json` profiles

| Profile | Distribution | Channel | Notes |
| --- | --- | --- | --- |
| `development` | internal | `development` | `developmentClient: true` |
| `preview` | internal | `preview` | Android builds as APK for sideloading |
| `production` | store | `production` | `autoIncrement: true` |

`cli.appVersionSource: "remote"` — build numbers are managed by EAS, not by the repo, so `autoIncrement` on the production profile is authoritative and local edits to build numbers are ignored.

### Toolchain

- **`babel.config.js`** — `babel-preset-expo` with `jsxImportSource: "nativewind"`, plus the `nativewind/babel` preset, and `react-native-reanimated/plugin` listed explicitly in `plugins`. Note that `babel-preset-expo` already includes the Reanimated plugin in SDK 54, so the explicit entry is redundant; it is harmless but is a candidate for removal.
- **`metro.config.js`** — Expo's default config wrapped with `withNativeWind` from `nativewind/metro`, with `input: "./global.css"`.
- **`tsconfig.json`** — extends `expo/tsconfig.base`, `strict: true`, and the `@/*` path alias that every import in the codebase uses.
- **`global.css`** — the three Tailwind directives, nothing else.
- **`eslint.config.js`** — `eslint-config-expo` flat config.

Scripts: `start`, `android`, `ios`, `web`, `lint`. There is no test script and no test suite. `react-native-web` and a `web.output: "static"` config are present, but the app is not designed for the browser — `expo-location`, `expo-notifications`, and haptics all degrade or fail there.

## Small things worth knowing

- **`hooks/useSunnah.ts`** is a one-line re-export of `useSunnah` and `SunnahProvider` from the context. Nothing imports it; every consumer imports from `@/context/SunnahContext` directly. It is a leftover.
- **`utils/index.ts`** is a barrel over the four util modules; consumers import the specific modules instead.
- **`components/ui/index.ts`** is a barrel that is likewise bypassed by direct imports.
- **`expo-constants`** is a dependency but only reached transitively; the settings version string is hardcoded rather than read from it.
- **`utils/date.ts` exports `parseTime`**, which nothing calls.
- **No test infrastructure.** The pure functions in `utils/` (`appendStreakDate`, `nextSunnahId`, `daysBetween`, `formatTime12h`) are written to be trivially testable and would be the natural starting point.
