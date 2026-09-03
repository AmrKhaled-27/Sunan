import { palette } from "@/constants/theme";
import { TourRect, useOnboarding } from "@/context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_PADDING = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_MARGIN = 20;
const TOOLTIP_HEIGHT_ESTIMATE = 190;
const SCREEN_GAP = 12;

const RECT_TIMING = { duration: 180, easing: Easing.out(Easing.cubic) };

function padRect(
  rect: TourRect,
  padding: number,
  windowWidth: number,
  windowHeight: number,
): TourRect {
  const x = Math.max(0, rect.x - padding);
  const y = Math.max(0, rect.y - padding);
  return {
    x,
    y,
    width: Math.min(windowWidth - x, rect.width + padding * 2),
    height: Math.min(windowHeight - y, rect.height + padding * 2),
  };
}

export function SpotlightOverlay() {
  const {
    isActive,
    step,
    stepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    targetRect,
    tabBarHeight,
    mirrorsLeft,
    next,
    back,
    finishTour,
  } = useOnboarding();

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenHeight = windowHeight;
  const screenWidth = windowWidth;
  const isTabBar = step?.targetKey === "tabBar";

  const [tooltipHeight, setTooltipHeight] = useState(0);

  const mirror = mirrorsLeft;

  const handleTooltipLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.height);
    setTooltipHeight((previous) =>
      Math.abs(previous - measured) > 1 ? measured : previous,
    );
  };

  // The hole collapses to a zero-sized point at the centre when a step has no
  // target, which makes the dim panels cover the whole screen.
  const holeX = useSharedValue(screenWidth / 2);
  const holeY = useSharedValue(screenHeight / 2);
  const holeWidth = useSharedValue(0);
  const holeHeight = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const hasAnimatedRef = useRef(false);

  const padding = step?.padding ?? DEFAULT_PADDING;
  const padded = useMemo(
    () =>
      isActive && targetRect
        ? padRect(targetRect, padding, screenWidth, screenHeight)
        : null,
    [isActive, targetRect, padding, screenWidth, screenHeight],
  );

  useEffect(() => {
    if (!isActive) {
      hasAnimatedRef.current = false;
      return;
    }

    const target = padded
      ? isTabBar
        ? {
            x: 0,
            y: padded.y,
            width: screenWidth,
            height: Math.max(screenHeight - padded.y, 150),
          }
        : padded
      : ({
          x: screenWidth / 2,
          y: screenHeight / 2,
          width: 0,
          height: 0,
        } as TourRect);

    if (hasAnimatedRef.current) {
      holeX.value = withTiming(target.x, RECT_TIMING);
      holeY.value = withTiming(target.y, RECT_TIMING);
      holeWidth.value = withTiming(target.width, RECT_TIMING);
      holeHeight.value = withTiming(target.height, RECT_TIMING);
    } else {
      holeX.value = target.x;
      holeY.value = target.y;
      holeWidth.value = target.width;
      holeHeight.value = target.height;
      hasAnimatedRef.current = true;
    }

    ringOpacity.value = withTiming(padded ? 1 : 0, { duration: 150 });
  }, [
    isActive,
    padded,
    screenWidth,
    screenHeight,
    holeX,
    holeY,
    holeWidth,
    holeHeight,
    ringOpacity,
  ]);

  // Top panel: spans full width from top of screen to the spotlight hole
  const topPanelStyle = useAnimatedStyle(() => ({
    top: 0,
    left: 0,
    right: 0,
    height: Math.max(0, holeY.value),
  }));

  // Bottom panel: spans full width from bottom of spotlight hole all the way
  // to the very bottom of the screen
  const bottomPanelStyle = useAnimatedStyle(() => {
    const start = holeY.value + holeHeight.value;
    return {
      top: start,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  // Covers everything physically left of the hole
  const leftPanelStyle = useAnimatedStyle(() => {
    const width = Math.max(0, holeX.value);
    return {
      top: holeY.value,
      left: mirror ? screenWidth - width : 0,
      width,
      height: Math.max(0, holeHeight.value),
    };
  });

  // Covers everything physically right of the hole
  const rightPanelStyle = useAnimatedStyle(() => {
    const start = holeX.value + holeWidth.value;
    const width = Math.max(0, screenWidth - start);
    return {
      top: holeY.value,
      left: mirror ? 0 : start,
      width,
      height: Math.max(0, holeHeight.value),
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    const width = Math.max(0, holeWidth.value);
    const x = holeX.value;
    return {
      top: holeY.value,
      left: mirror ? screenWidth - x - width : x,
      width,
      height: isTabBar ? Math.max(0, screenHeight - holeY.value) : Math.max(0, holeHeight.value),
      opacity: ringOpacity.value,
      borderRadius: isTabBar ? 0 : 18,
      borderTopWidth: 2,
      borderLeftWidth: isTabBar ? 0 : 2,
      borderRightWidth: isTabBar ? 0 : 2,
      borderBottomWidth: isTabBar ? 0 : 2,
      elevation: 0,
      backgroundColor: "transparent",
    };
  });

  if (!isActive || !step) return null;

  const topLimit = insets.top + SCREEN_GAP;
  const bottomLimit = screenHeight - insets.bottom - SCREEN_GAP;
  const height = tooltipHeight || TOOLTIP_HEIGHT_ESTIMATE;

  // Calculate absolute top position for the tooltip modal to ensure it NEVER
  // covers the highlighted target
  let tooltipTop: number;

  if (!padded) {
    // Centered modal for welcome step
    tooltipTop = Math.max(topLimit, (screenHeight - height) / 2);
  } else {
    const targetTop =
      step.targetKey === "tabBar"
        ? screenHeight - (padded.height || tabBarHeight)
        : padded.y;
    const targetBottom = padded.y + padded.height;

    const fitsBelow =
      targetBottom + TOOLTIP_GAP + height <=
      screenHeight - tabBarHeight - SCREEN_GAP;
    const fitsAbove = targetTop - TOOLTIP_GAP - height >= topLimit;

    // For bottom tab bar or buttons at the bottom of the screen, place above
    if (step.targetKey === "tabBar") {
      tooltipTop = targetTop - TOOLTIP_GAP - height;
    } else if (
      step.targetKey === "markDone" ||
      step.targetKey === "alreadyDoing" ||
      step.targetKey === "skip"
    ) {
      if (fitsAbove) {
        tooltipTop = targetTop - TOOLTIP_GAP - height;
      } else if (fitsBelow) {
        tooltipTop = targetBottom + TOOLTIP_GAP;
      } else {
        tooltipTop = Math.max(topLimit, targetTop - TOOLTIP_GAP - height);
      }
    } else {
      // For card / streak dots: prefer below
      if (fitsBelow) {
        tooltipTop = targetBottom + TOOLTIP_GAP;
      } else if (fitsAbove) {
        tooltipTop = targetTop - TOOLTIP_GAP - height;
      } else {
        const spaceBelow = bottomLimit - targetBottom;
        const spaceAbove = targetTop - topLimit;
        if (spaceBelow >= spaceAbove) {
          tooltipTop = targetBottom + 6;
        } else {
          tooltipTop = Math.max(topLimit, targetTop - height - 6);
        }
      }
    }
  }

  return (
    <Animated.View
      style={styles.root}
      entering={FadeIn.duration(200)}
      accessibilityViewIsModal
    >
      {/* Absorbs touches so background elements cannot be pressed during the tour, and prevents advancing by clicking outside */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {}}
        accessible={false}
        importantForAccessibility="no"
      />

      <Animated.View style={[styles.dim, topPanelStyle]} pointerEvents="none" />
      <Animated.View
        style={[styles.dim, bottomPanelStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.dim, leftPanelStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.dim, rightPanelStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />

      {/* Direct positioned tooltip modal */}
      <Animated.View
        key={step.id}
        entering={FadeIn.duration(160)}
        onLayout={handleTooltipLayout}
        style={[
          styles.tooltip,
          {
            position: "absolute",
            top: tooltipTop,
            left: TOOLTIP_MARGIN,
            right: TOOLTIP_MARGIN,
          },
        ]}
      >
        <Text className="font-tajawal-bold text-warmBrown text-lg text-center mb-1.5">
          {step.title}
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-sm text-center leading-6">
          {step.body}
        </Text>

        <View className="h-[0.5px] bg-warmGold/25 my-3" />

        <View className="flex-row justify-center items-center gap-1.5 mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={
                i === stepIndex
                  ? "w-4 h-1.5 rounded-full bg-warmGold"
                  : "w-1.5 h-1.5 rounded-full bg-warmGold/30"
              }
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={finishTour}
            accessibilityRole="button"
            accessibilityLabel="تخطي الشرح"
            className="py-1.5"
          >
            <Text className="font-tajawal text-warmBrownMuted text-xs underline">
              تخطي الشرح
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {!isFirstStep && (
              <TouchableOpacity
                onPress={back}
                accessibilityRole="button"
                accessibilityLabel="الخطوة السابقة"
                className="w-9 h-9 rounded-xl items-center justify-center border border-warmGold/30"
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={palette.warmGold}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={next}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? "إنهاء الشرح" : "الخطوة التالية"}
              className="bg-warmGold px-4 h-9 rounded-xl items-center justify-center"
            >
              <Text className="font-tajawal-bold text-white text-sm">
                {isLastStep ? "ابدأ" : "التالي"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.62)",
    elevation: 9999,
  },
  ring: {
    position: "absolute",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.warmGold,
    backgroundColor: "transparent",
  },
  tooltip: {
    backgroundColor: palette.parchmentLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(196, 164, 108, 0.35)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10001,
  },
});
