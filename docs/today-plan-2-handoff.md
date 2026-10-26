# Today page redesign — Plan 2

Implemented 2026-10-24, then revised following the user's device feedback about RTL alignment and the visual design. Further native visual acceptance is pending the user's device review. No web app testing, emulator testing, or device screenshots were performed here.

## Device-feedback revision

- Fixed the native RTL alignment error. RN 0.81 mirrors `textAlign: right` under RTL layout; the new `ArabicText` component explicitly sets RTL layout/writing direction and native logical-start alignment. Actions, rewards, evidence/citations, menus, confirmations, celebrations, and tour text use it. Centered labels are explicitly centered. Verified the behavior against the installed Android `TextLayoutManager.kt` and iOS `RCTAttributedTextUtils.mm` source.
- Restored a large centered page title and the app's existing manuscript card, floral badge, corner decorations, and gold framing around the routine heading.
- Restored compact gold progress dots, including the outlined current day, with flexible sizing for narrow screens.
- Replaced the three-dot control with a labeled «خيارات المجموعة» button and updated its tour description.
- Kept the rewards behavior and removed the sparkles icon.

## Experience

- The Today tab is now «سنن اليوم». A prominent routine heading and visible options button lead into seven-day progress, an attributed rewards panel, one numbered action panel, and a sources button.
- Every remaining member's full action is immediately readable. No individual completion controls or inline hadiths are shown.
- Rewards show the first nonempty reward in presentation order. Additional rewards expand without duplicating the preview. Expansion resets when the routine changes, and remains intact when sources are opened or closed.
- Sources use a bounded, independently scrolling native modal with a persistent close control. Every original evidence entry is rendered under its Sunnah with full text, citation, and Arabic grading.
- The daily action stays outside the scroll view. The tab bar now participates in normal layout, including its safe area, so the footer and content reserve their actual heights without magic bottom padding. Old tab overlap padding was removed from Settings and Achievements.
- Already-doing and postponement share one native modal with their confirmations, avoiding overlapping modal presentations. Both affect the whole displayed group.
- The seventh-day celebration captures the completed routine and newly credited titles before rotation. Its native modal blocks background page/tab actions and handles Android back. The next routine can still be marked on the same day.
- On routine changes the page returns to the top, closes dialogs, and resets rewards. Ordinary daily marking preserves reading position.
- Onboarding targets the actual action panel, progress, fixed daily button, and visible menu. Long panels highlight their visible opening, and tour scrolling uses the actual scroll viewport above the footer. Tooltips can scroll at larger text sizes.

## Boundaries

The existing context, persistence, rotation, reminders, and per-Sunnah achievements remain authoritative. No catalog content or hadith data was edited. No dependencies or routes were added.

The requested Expo 54 docs URL redirected to latest. Before implementation, the SDK 54 haptics documentation was read from Expo's `sdk-54` source branch at `docs/pages/versions/v54.0.0/sdk/haptics.mdx`; the installed SDK remains 54.

## Verification

- `npm test`: 22 tests (14 existing routine/storage/notification tests, 3 content-rendering tests, a regression check for native RTL alignment versus CSS alignment, and 4 screen-event/effect-boundary tests).
- New tests render actual UI component content with native host stubs, covering every routine's full actions, all 39 evidence entries in order with citations/gradings, and reward preview attribution/empty reward handling. These are not native visual or interaction tests.
- `npx tsc --noEmit`: passes.
- `npm run lint`: passes without warnings, including the previously reported onboarding dependency warning.
- `git diff --check`: passes.
- Exact evidence comparison: read `constants/data.ts` from Git revision `2e016730e83c0046618435f7d2cd0be2c32a1974` with `git show`, transpiled it with the installed TypeScript compiler, and deep-compared every original Sunnah's ordered `hadiths` array against `constants/sunnahs.ts`. All 26 IDs and 39 complete evidence objects match. No baseline or expected content was regenerated. The old verifier was retired at the user's request during Plan 1, so this was a read-only comparison against the recorded original revision.

## Device review

The user chose to review on their own device. Still to verify visually: narrow screens and larger system text; four-member and single-member groups; expanded rewards; scrolling to the last source entry; modal focus and Android back; full onboarding; footer/tab safe areas; day-seven and final celebrations. Native haptics/confetti and accessibility focus have not been exercised here.

Start with `npm start` and open the app in the existing SDK 54-compatible device setup. These checks do not claim visual acceptance or OS notification delivery.

## Review fixes

- Daily-action locks follow the current context callbacks, so a foreground refresh that rejects a stale tap cannot leave the visible button unresponsive. Callbacks retained from an older render cannot re-lock the latest screen.
- Dialog state includes its opening routine ID, hiding outdated confirmations during render rather than waiting for an effect. A synchronous dialog ref also rejects queued confirmation callbacks after cancellation.
- First-launch onboarding waits while a sources/options/celebration modal is open.
- Page, footer, modal, and celebration padding now includes horizontal safe insets for landscape notches.
- Screen handler regressions exercise rapid/stale daily taps, canceled confirmations, routine-change dialog reset before effects, sources preserving reward identity and progress, modal onboarding deferral, and final celebration identity. The tests use retained hook state and host stubs; they do not verify native rendering or focus behavior.

## Unified manuscript redesign

Implemented 2026-10-25 following design review:

- Unified the routine header, 7-day progress, Sunnah actions, and sources trigger into one cohesive, gilded manuscript plate, eliminating fragmented nested cards.
- Enhanced Card's home variant with crisp vector corner hairlines and double gilded borders, removing the floating tulip sticker and corner image clippings.
- Positioned inline spiritual rewards (`✦ الفضل: «...»`) in warm Amiri script under each Sunnah's action text, maintaining title and action as primary reading heroes.
- Placed a compact, understated `[ 📖 المصادر والأحاديث ]` button inside the manuscript plate to open the full evidence modal.
- Added direct, discoverable routine lifecycle buttons (`[ أمارسها بالفعل ]` and `[ تأجيل المجموعة ]`) at the end of the scrollable content, while keeping the sticky footer focused exclusively on the daily habit action (`[ فعلتها اليوم ]`).
