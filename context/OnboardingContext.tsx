import {
  ONBOARDING_STEPS,
  OnboardingStep,
  TourTargetKey,
} from "@/components/onboarding/steps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dimensions, I18nManager, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ONBOARDING_KEY = "@sonan_onboarding_v1";

/** Mirrors the standard tabBarStyle in app/(tabs)/_layout.tsx */
const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_MARGIN_H = 0;

const SAFE_GAP = 12;
const MEASURE_ATTEMPTS = 4;
const MEASURE_RETRY_DELAY = 30;
const MEASURE_TIMEOUT = 120;
const SCROLL_EPSILON = 4;
const SCROLL_PASSES = 2;
/** Gives an animated scroll time to start before we watch it for a resting position. */
const SCROLL_START_DELAY = 40;
const SETTLE_POLL_INTERVAL = 25;
const SETTLE_MAX_POLLS = 5;
const SETTLE_EPSILON = 1;
const AUTO_START_DELAY = 400;

export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Any node that can report its position in window coordinates. */
export interface TourMeasurable {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

export interface TourScroller {
  scrollTo: (y: number) => void;
  getOffset: () => number;
}

interface TourBounds {
  windowWidth: number;
  windowHeight: number;
  tabBarHeight: number;
  topLimit: number;
  bottomLimit: number;
}

interface OnboardingContextType {
  isActive: boolean;
  step: OnboardingStep | null;
  stepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  targetRect: TourRect | null;
  /** Height of the bottom tab bar, so the overlay can keep clear of it. */
  tabBarHeight: number;
  /**
   * True when React Native resolves the `left` inset against the layout's
   * start edge, which mirrors absolute positions in an RTL layout.
   */
  mirrorsLeft: boolean;
  startTour: () => void;
  next: () => void;
  back: () => void;
  finishTour: () => void;
  registerTarget: (key: TourTargetKey, node: TourMeasurable | null) => void;
  unregisterTarget: (key: TourTargetKey) => void;
  registerOriginProbe: (node: TourMeasurable | null) => void;
  registerMirrorMarker: (node: TourMeasurable | null) => void;
  registerScroller: (scroller: TourScroller | null) => void;
  setHomeReady: (ready: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Resolves to null when the node reports a zero-sized frame or never calls
 * back, which happens while it is still laying out or already unmounted.
 */
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

/**
 * How far the scroller must move for the rect to sit inside the visible band
 * with ample room for the explanation tooltip above or below it.
 */
function scrollDeltaFor(
  rect: TourRect,
  bounds: TourBounds,
  targetKey?: TourTargetKey,
): number {
  // For targets in the upper part of content (card, streakDots):
  // Align target near the top of the visible band so there is maximum room below for the tooltip
  if (targetKey === "card" || targetKey === "streakDots") {
    return rect.y - bounds.topLimit;
  }

  // For buttons in the lower part of content (markDone, alreadyDoing, skip):
  // Align the bottom of the button near bottomLimit so there is maximum room above for the tooltip
  if (
    targetKey === "markDone" ||
    targetKey === "alreadyDoing" ||
    targetKey === "skip"
  ) {
    const targetBottom = rect.y + rect.height;
    return targetBottom - bounds.bottomLimit;
  }

  // General bounds checking:
  const band = bounds.bottomLimit - bounds.topLimit;
  if (rect.height >= band || rect.y < bounds.topLimit) {
    return rect.y - bounds.topLimit;
  }

  const overflow = rect.y + rect.height - bounds.bottomLimit;
  return overflow > 0 ? overflow : 0;
}

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const [homeReady, setHomeReady] = useState(false);
  // Seeded from the platform flags so the first frame is usually right, then
  // corrected by measuring the marker probe.
  const [mirrorsLeft, setMirrorsLeft] = useState(
    () => I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL,
  );

  const targetsRef = useRef(new Map<TourTargetKey, TourMeasurable>());
  const scrollerRef = useRef<TourScroller | null>(null);
  const originProbeRef = useRef<TourMeasurable | null>(null);
  const mirrorMarkerRef = useRef<TourMeasurable | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  // Bumped on every step change so stale async measurements are discarded.
  const measureTokenRef = useRef(0);
  // Mirrors of state so the step callbacks stay referentially stable and can
  // never act on a tour that is no longer running.
  const stepIndexRef = useRef(0);
  stepIndexRef.current = stepIndex;
  const isActiveRef = useRef(false);
  isActiveRef.current = isActive;

  const tabBarHeight = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 10);

  const boundsRef = useRef<TourBounds>({
    windowWidth,
    windowHeight,
    tabBarHeight,
    topLimit: insets.top + SAFE_GAP,
    bottomLimit: windowHeight - tabBarHeight - SAFE_GAP,
  });
  boundsRef.current = {
    windowWidth,
    windowHeight,
    tabBarHeight,
    topLimit: insets.top + SAFE_GAP,
    bottomLimit: windowHeight - tabBarHeight - SAFE_GAP,
  };

  // ── Persisted flag ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(stored === "done");
      } catch (error) {
        // Treat an unreadable flag as "seen" so a storage failure cannot
        // trap the user in a tour we are unable to dismiss permanently.
        console.warn("Failed to read onboarding flag", error);
        setHasSeenOnboarding(true);
      }
    })();
  }, []);

  // ── Target registry ───────────────────────────────────────────────────────
  const registerTarget = useCallback(
    (key: TourTargetKey, node: TourMeasurable | null) => {
      if (node) targetsRef.current.set(key, node);
      else targetsRef.current.delete(key);
    },
    [],
  );

  const unregisterTarget = useCallback((key: TourTargetKey) => {
    targetsRef.current.delete(key);
  }, []);

  const registerScroller = useCallback((scroller: TourScroller | null) => {
    scrollerRef.current = scroller;
  }, []);

  const registerOriginProbe = useCallback((node: TourMeasurable | null) => {
    originProbeRef.current = node;
  }, []);

  const registerMirrorMarker = useCallback((node: TourMeasurable | null) => {
    mirrorMarkerRef.current = node;
  }, []);

  // ── Calibration ───────────────────────────────────────────────────────────
  /**
   * Resolves the two coordinate-space differences between what measureInWindow
   * reports and where the overlay can actually draw, by measuring probes whose
   * intended position is known. Both are observed rather than derived from
   * platform flags, so no assumption can silently go stale.
   */
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

  /** Returns the target's frame in the overlay's coordinate space. */
  const resolveRect = useCallback(
    async (key: TourTargetKey): Promise<TourRect | null> => {
      for (let attempt = 0; attempt < MEASURE_ATTEMPTS; attempt++) {
        const node = targetsRef.current.get(key);
        if (node) {
          const rect = await measureInWindowAsync(node);
          if (rect) {
            const origin = originRef.current;
            return {
              ...rect,
              x: rect.x - origin.x,
              y: rect.y - origin.y,
            };
          }
        }
        await wait(MEASURE_RETRY_DELAY);
      }
      return null;
    },
    [],
  );

  /**
   * Samples the target until two readings agree. A scroll animation is still
   * in flight for a few frames after it is commanded, and measuring mid-flight
   * places the spotlight where the target used to be.
   */
  const resolveSettledRect = useCallback(
    async (
      key: TourTargetKey,
      isStale: () => boolean,
    ): Promise<TourRect | null> => {
      let previous = await resolveRect(key);

      for (let poll = 0; poll < SETTLE_MAX_POLLS; poll++) {
        if (isStale()) return null;
        await wait(SETTLE_POLL_INTERVAL);
        if (isStale()) return null;

        const current = await resolveRect(key);
        if (!current) return previous;
        if (previous && Math.abs(current.y - previous.y) <= SETTLE_EPSILON) {
          return current;
        }
        previous = current;
      }

      return previous;
    },
    [resolveRect],
  );

  const measureStep = useCallback(
    async (index: number) => {
      const step = ONBOARDING_STEPS[index];
      if (!step) return;

      measureTokenRef.current += 1;
      const token = measureTokenRef.current;
      const isStale = () => token !== measureTokenRef.current;

      if (!step.targetKey) {
        setTargetRect(null);
        return;
      }

      await refreshCalibration();
      if (isStale()) return;

      let rect =
        (await resolveRect(step.targetKey)) ||
        (await resolveSettledRect(step.targetKey, isStale));
      if (isStale()) return;

      // If tabBar was not resolved through ref, fall back to calculated screen bounds
      if (!rect && step.targetKey === "tabBar") {
        const bounds = boundsRef.current;
        rect = {
          x: 0,
          y: bounds.windowHeight - bounds.tabBarHeight,
          width: bounds.windowWidth,
          height: bounds.tabBarHeight,
        };
      }

      // Scroll and re-measure until the target sits inside the visible band.
      // Iterating keeps the spotlight accurate even when the reported scroll
      // offset lags or the scroller clamps at one of its ends.
      const scroller = scrollerRef.current;
      if (rect && scroller && step.targetKey !== "tabBar") {
        for (let pass = 0; pass < SCROLL_PASSES; pass++) {
          const delta = scrollDeltaFor(rect, boundsRef.current, step.targetKey);
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
      }

      setTargetRect(rect);
    },
    [refreshCalibration, resolveSettledRect],
  );

  useEffect(() => {
    if (!isActive) return;
    void measureStep(stepIndex);
  }, [isActive, stepIndex, measureStep]);

  // ── Tour control ──────────────────────────────────────────────────────────
  const startTour = useCallback(() => {
    measureTokenRef.current += 1;
    isActiveRef.current = true;
    stepIndexRef.current = 0;
    setTargetRect(null);
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const finishTour = useCallback(() => {
    if (!isActiveRef.current) return;
    measureTokenRef.current += 1;
    isActiveRef.current = false;
    stepIndexRef.current = 0;
    setIsActive(false);
    setStepIndex(0);
    setTargetRect(null);
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(ONBOARDING_KEY, "done").catch((error) =>
      console.warn("Failed to persist onboarding flag", error),
    );
  }, []);

  const next = useCallback(() => {
    if (!isActiveRef.current) return;
    if (stepIndexRef.current >= ONBOARDING_STEPS.length - 1) {
      finishTour();
      return;
    }
    setStepIndex(stepIndexRef.current + 1);
  }, [finishTour]);

  const back = useCallback(() => {
    if (!isActiveRef.current || stepIndexRef.current === 0) return;
    setStepIndex(stepIndexRef.current - 1);
  }, []);

  // ── First-launch auto start ───────────────────────────────────────────────
  useEffect(() => {
    if (hasSeenOnboarding !== false || !homeReady || isActive) return;
    const timer = setTimeout(startTour, AUTO_START_DELAY);
    return () => clearTimeout(timer);
  }, [hasSeenOnboarding, homeReady, isActive, startTour]);

  const step = isActive ? (ONBOARDING_STEPS[stepIndex] ?? null) : null;

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        step,
        stepIndex,
        totalSteps: ONBOARDING_STEPS.length,
        isFirstStep: stepIndex === 0,
        isLastStep: stepIndex === ONBOARDING_STEPS.length - 1,
        targetRect,
        tabBarHeight,
        mirrorsLeft,
        startTour,
        next,
        back,
        finishTour,
        registerTarget,
        unregisterTarget,
        registerOriginProbe,
        registerMirrorMarker,
        registerScroller,
        setHomeReady,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
