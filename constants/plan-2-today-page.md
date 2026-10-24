# Plan 2: Today page for multiple Sunnahs

Status: agreed initial UI implementation plan, created 2026-10-24. Implement in a later session when requested, after [Plan 1](plan-1-routine-data.md).

The user approved this as a starting design to implement and evaluate, with room for later visual feedback. The original [proposal](plan.md) is background; these two implementation plans supersede conflicting parts, especially per-Sunnah “already doing” and inline hadith display.

## Outcome and prerequisites

Show one active routine's Sunnahs together on one naturally scrolling Today page. Users can read every title and full action directly, see encouraging reward text, open every supporting hadith, and mark the whole routine for today with one tap.

Before writing code, read repository instructions and the exact Expo SDK 54 docs at https://docs.expo.dev/versions/v54.0.0/. Verify the version if the URL redirects. Reuse the existing Expo/React Native setup and UI components; no SDK upgrade or additional navigation route is required.

Read Plan 1's implementation handoff and actual context contract first. Plan 2 consumes the routine state and actions; it does not redesign persistence, migrate progress, alter learning behavior, or edit protected evidence.

## Settled experience

- One vertical scroll view; no slider, carousel, next/previous step navigation, or mandatory action expansion.
- One shared action panel containing numbered Sunnah sections with subtle dividers, rather than repeating the ornate home card for each Sunnah.
- Every Sunnah section immediately displays its title and complete action text.
- Numbers indicate presentation order, not a prescribed religious sequence or individual completion status.
- No hadith excerpts or full hadith text on the main page. A routine-level “عرض المصادر” button opens all evidence in a modal.
- Rewards occupy a separate panel above the action panel. One attributed reward is visible immediately; the remaining rewards can be expanded.
- One fixed daily completion button above the bottom tabs, independent of scroll position.
- Whole-routine “Already doing” and “Postpone” are in a secondary menu near the routine heading and require confirmation.
- Daily completion is self-reported. Do not require reading sources, reaching the bottom, checking individual members, or proving practice frequency.

## 1. Page structure and styling

Use this top-to-bottom order:

1. Page heading: suggested label “سنن اليوم”.
2. Active routine title, optional short intro, and a secondary-actions menu trigger near the heading. Avoid jargon such as storage versions or implementation-facing routine IDs.
3. Existing seven-day progress dots for the active routine.
4. Separate “الفضل والثواب” rewards panel.
5. One action panel with numbered Sunnah title/action sections.
6. Routine-level “عرض المصادر” button below the action panel.
7. Enough bottom scroll padding to reveal the last content above the fixed daily action and tabs.

The daily action sits outside the scrolling content, above the actual tab-bar boundary and safe area. Measure/derive occupied space from the real layout rather than relying on the old fixed `pb-[100px]` padding.

Retain the warm parchment, gold, and olive palette, existing Arabic typography, and established rounded surfaces. Reuse `PaperBackground`, `Card`, `Button`, `StreakDots`, and modal primitives where appropriate. Avoid repeating decorative ornaments between every member.

Prefer comfortable Arabic line height and spacing over fitting the entire routine onto one screen. Long actions must wrap fully, without truncation or shrinking fonts. Support right-to-left reading, narrow devices, and larger system text sizes. The agreed design permits natural scrolling; it does not promise that four long actions will fit into one viewport.

## 2. Action panel

Render the active routine's ordered remaining members from Plan 1's selectors. With the initial disjoint catalog and whole-routine actions, these ordinarily comprise all its active members. Do not display a different subset from the one credited by the daily action.

Each section contains a presentation number, title, and full action. Use subtle separation and clear typographic hierarchy. Do not add per-Sunnah completion buttons, checkboxes, “already doing,” or progress indicators. Do not collapse titles/actions behind accordions.

A single-Sunnah routine uses the same structure; do not create a separate flow. When a routine has no remaining members, the context should already have advanced or reached all-complete; avoid rendering an empty practice panel with an enabled completion button.

## 3. Separate rewards panel

Keep encouragement visible without interleaving reward blocks among actions:

- Place a compact panel labelled “الفضل والثواب” below streak progress and above the action panel.
- In the default collapsed state, show the first displayed Sunnah in presentation order that has a nonempty reward, with that Sunnah's title and complete reward text.
- If other displayed members have rewards, show “عرض بقية الفضائل”. Expanding reveals the other rewards in presentation order, each attributed to its Sunnah title; provide an obvious collapse action.
- Keep the preview visible when expanded without repeating it in the additional list.
- With one available reward, show it without an expansion control. With no available rewards, omit the panel.
- Do not rotate reward text, introduce a carousel, truncate the preview, or invent a combined reward for the routine.

Rewards remain separately authored Sunnah content; do not modify hadith evidence to construct the panel. Existing reward text may be edited only intentionally within the allowed non-hadith scope, not silently rewritten as an assertion applying to every member.

Reset reward expansion when the active routine changes. Preserve it while opening/closing the sources modal on the same routine.

## 4. Routine sources modal

Use a tall, bounded-height modal with a clear title, visible close control, safe-area accommodation, and an independently scrollable body. Reuse/adapt `BaseModal` rather than introducing a new navigation route or modal dependency. Its existing compact width/padding may need an override suitable for reading long Arabic evidence.

Open through the page's “عرض المصادر” control. Group content under each Sunnah title in routine presentation order. For each Sunnah, render every evidence entry in its original order, including:

- Full untruncated hadith text.
- Source/citation.
- Readable Arabic grading label representing the stored grading value.

Keep all original evidence intact even when the same text/source appears under multiple Sunnahs. Do not merge, deduplicate, summarize, normalize, or reassign evidence. Optional evidence IDs support stable keys but need not appear as user-facing content. Use a stable fallback key when an evidence ID is absent.

The current screen only renders `hadiths[0].text`; replace that assumption with full arrays. Every routine member's evidence must be reachable, including members with multiple evidence entries. Do not claim the modal covers the entire catalog when it covers only the active routine.

Opening/closing sources must not mark practice, modify progress, clear scroll position on the main page, or change the routine. Support close button, Android back, and the project's established backdrop dismissal. Keep modal controls accessible and prevent background actions while a modal is open. On a routine change, close/reset sources to avoid stale content.

Rewards already have their own main-page panel; do not duplicate the rewards UI inside the sources modal merely to fill space.

## 5. Fixed daily action and transitions

Use routine-level wording; suggested button labels are “فعلتها اليوم” and disabled “تمّ اليوم”. On the final copy pass, make clear that the tap covers the displayed set of Sunnahs, without a required confirmation for ordinary daily marking.

The action remains visible while scrolling and does not overlap text, the bottom tabs, or system navigation areas. It is disabled after the active routine has been marked today. Do not disable it simply because the user has not scrolled or opened sources.

On day seven, use Plan 1's completion action, then show the existing celebration adapted to the completed routine and its newly accomplished Sunnahs. Capture the completed routine's title before rotation. Dismissing celebration reveals the next routine with fresh progress; its first day may also be marked today.

On any routine change, return the main page to the top and reset transient state (sources, reward expansion, menu, and confirmations). Preserve the captured completed routine's celebration data while its modal is shown. Below seven days, marking today leaves the user on the same routine without resetting reading position.

Retain haptic feedback and the broken-streak toast where compatible. Guard fast repeated taps through the Plan 1 contract. Do not present the next routine's fresh enabled button as evidence that the completed routine's mark was lost; celebration and the new title/progress establish the transition.

## 6. Secondary actions and confirmations

Provide one discoverable, accessible menu trigger near the routine heading. Its items are whole-routine “أفعل هذه السنن بالفعل” and “تأجيل هذه السنن”, or similarly clear final Arabic copy.

- “Already doing” confirmation names the routine and explains that all its remaining Sunnahs become accomplished immediately and the app advances without waiting seven days.
- “Postpone” explains that it postpones the entire routine, clears its current streak, and brings it back later in rotation. Preserve Plan 1's exact behavior even when this selects the same routine because it is the only one unfinished.
- Cancel/backdrop/back actions have no progress effect.
- Confirm closes the menu/dialog and invokes the corresponding context action once.

Remove the old standalone per-Sunnah controls and singular copy. Do not add individual opt-outs inside the list or confirmation dialogs.

## 7. States, onboarding, and neighboring screens

Loading: retain the app's loading treatment and avoid flashing stale routine content or enabled controls before state is ready.

Marked today: keep actions, rewards, and sources readable; show filled progress and the disabled daily action. Retain secondary actions as permitted by the existing behavior.

All complete: retain an encouraging all-complete page with no active daily button or empty menu/sources controls. A final completion celebration must still appear even when there is no next routine.

Adapt the onboarding tour rather than leaving stale measurements or text:

- “card” should highlight the shared action panel; “streakDots” and “markDone” should target the actual progress and fixed action.
- Update welcome and explanations for multiple Sunnahs and routine-level daily credit, rewards, and sources.
- Existing “alreadyDoing”/“skip” targets will move into a menu. Either teach the visible menu trigger and explain its options in one step, or explicitly open the menu before measuring its items. Do not target hidden controls or silently leave those steps broken.
- If target keys or steps change, update their types, registration, overlay behavior, and cleanup together.
- Check tour scrolling around the fixed footer and expanded rewards so highlighted content is actually visible.

Update the Today tab label and related visible singular copy consistently with “سنن اليوم”. Keep achievements per Sunnah; no achievement grouping or redesign is part of this plan. Only make necessary copy adjustments to explain that one routine can add several Sunnahs.

## 8. Suggested component and file changes

- `screens/ActiveSunnah/index.tsx`: compose routine header, progress, rewards, action panel, sources, fixed action, menu, and transient-state handling.
- New local components such as `RoutineActionsPanel`, `RoutineRewardsPanel`, and `RoutineSourcesModal`: keep rendering responsibilities separate without duplicating catalog or progress state.
- Existing `AlreadyDoingModal`, `SkipModal`, and `StreakCompleteModal`: finish routine wording/layout using Plan 1 actions.
- `components/ui/BaseModal.tsx`: adapt through supported props/styles first; shared changes must preserve other dialogs.
- `components/onboarding/steps.ts` and related context/target types: reflect the final layout and menu approach.
- `app/(tabs)/_layout.tsx`: update Today label and verify footer/tab-bar spacing.

These are proposed component names, not a requirement to rename the existing screen directory. Reuse the actual Plan 1 exports rather than reintroducing `currentSunnah` as an alias for the first routine member.

## 9. Verification and acceptance

Run Plan 1's exact hadith-preservation verifier after UI work, `npx tsc --noEmit`, and `npm run lint`. No expected-evidence updates are allowed to make a UI change pass.

Visually verify on representative Android/iOS layouts where available, recording actual platform coverage:

- Four-member routine, longest action texts, long reward preview, and the single-member routine.
- All titles and actions readable without extra taps; large text and narrow screens wrap without clipping.
- Rewards preview/expand/collapse, multiple rewards, and absent rewards.
- Sources modal containing every evidence entry with source and grading, including a multi-hadith Sunnah and long text; scroll to its final entry and close it.
- Fixed daily action with bottom tabs, safe areas, full-page scrolling, expanded rewards, and modal overlays.
- Daily mark, disabled state, seven-day celebration, same-day next routine, already-doing, postponement, cancellation, broken streak, reload, and all-complete state.
- Entire onboarding tour, including menu explanation and sticky-action targeting.
- Screen-reader labels/order, accessible expanded/disabled states, close controls, and modal focus behavior.

Use focused interaction tests where they cover real risks: whole-routine action dispatch, all evidence rendered, sources not changing progress, and state reset on routine changes. Do not add tests that merely assert decorative styles or mirror component internals.

Plan 2 is complete when the agreed layout is implemented, all routine actions remain consistent with Plan 1, every protected hadith remains exact and accessible in sources, encouragement is visible in its separate panel, and the final result has been visually inspected. Include screenshots or an equivalent reviewable preview in the implementation handoff where tooling permits, with any platform limitations stated plainly.
