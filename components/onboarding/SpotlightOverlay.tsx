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
const TOOLTIP_HEIGHT_ESTIMATE = 210;
const SCREEN_GAP = 12;

const RECT_TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

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
	const [tooltipHeight, setTooltipHeight] = useState(0);

	/**
	 * Measured geometry is physical, but React Native resolves `left` against
	 * the layout's start edge in this RTL app, which mirrors absolute positions.
	 * The conversion is inlined into each animated style below because only
	 * plain values from component scope cross reliably onto the UI thread.
	 */
	const mirror = mirrorsLeft;

	// Rounded, with a dead zone, so sub-pixel layout noise cannot re-render the
	// tooltip. Only a real change of content height should move the anchor.
	const handleTooltipLayout = (event: LayoutChangeEvent) => {
		const measured = Math.round(event.nativeEvent.layout.height);
		setTooltipHeight((previous) =>
			Math.abs(previous - measured) > 1 ? measured : previous,
		);
	};

	// The hole collapses to a zero-sized point at the centre when a step has no
	// target, which makes the four dim panels cover the whole screen.
	const holeX = useSharedValue(windowWidth / 2);
	const holeY = useSharedValue(windowHeight / 2);
	const holeWidth = useSharedValue(0);
	const holeHeight = useSharedValue(0);
	const ringOpacity = useSharedValue(0);
	const hasAnimatedRef = useRef(false);

	const padding = step?.padding ?? DEFAULT_PADDING;
	const padded = useMemo(
		() =>
			isActive && targetRect
				? padRect(targetRect, padding, windowWidth, windowHeight)
				: null,
		[isActive, targetRect, padding, windowWidth, windowHeight],
	);

	useEffect(() => {
		if (!isActive) {
			hasAnimatedRef.current = false;
			return;
		}

		const target =
			padded ??
			({
				x: windowWidth / 2,
				y: windowHeight / 2,
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

		ringOpacity.value = withTiming(padded ? 1 : 0, { duration: 200 });
	}, [
		isActive,
		padded,
		windowWidth,
		windowHeight,
		holeX,
		holeY,
		holeWidth,
		holeHeight,
		ringOpacity,
	]);

	// Full-width panels are symmetric, so mirroring cannot move them.
	const topPanelStyle = useAnimatedStyle(() => ({
		top: 0,
		left: 0,
		width: windowWidth,
		height: Math.max(0, holeY.value),
	}));

	const bottomPanelStyle = useAnimatedStyle(() => {
		const start = holeY.value + holeHeight.value;
		return {
			top: start,
			left: 0,
			width: windowWidth,
			height: Math.max(0, windowHeight - start),
		};
	});

	// Covers everything physically left of the hole.
	const leftPanelStyle = useAnimatedStyle(() => {
		const width = Math.max(0, holeX.value);
		return {
			top: holeY.value,
			left: mirror ? windowWidth - width : 0,
			width,
			height: Math.max(0, holeHeight.value),
		};
	});

	// Covers everything physically right of the hole.
	const rightPanelStyle = useAnimatedStyle(() => {
		const start = holeX.value + holeWidth.value;
		const width = Math.max(0, windowWidth - start);
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
			left: mirror ? windowWidth - x - width : x,
			width,
			height: Math.max(0, holeHeight.value),
			opacity: ringOpacity.value,
		};
	});

	if (!isActive || !step) return null;

	const topLimit = insets.top + SCREEN_GAP;
	const bottomLimit = windowHeight - tabBarHeight - SCREEN_GAP;
	const height = tooltipHeight || TOOLTIP_HEIGHT_ESTIMATE;

	// The tooltip is anchored to one edge of the safe band by an inset that
	// never refers to its own height. Deriving the position from the measured
	// height instead makes onLayout feed back into the layout it just measured,
	// which oscillates: Android rounds a view's height off its rounded top and
	// bottom edges, so moving the tooltip can flip the reported height by a
	// pixel, which moves it again. The height only picks the anchor here.
	let anchor: "top" | "bottom" | "center";
	let inset = 0;

	if (!padded) {
		anchor = "center";
	} else {
		const below = padded.y + padded.height + TOOLTIP_GAP;
		const above = padded.y - TOOLTIP_GAP;

		if (below + height <= bottomLimit) {
			anchor = "top";
			inset = below - topLimit;
		} else if (above - height >= topLimit) {
			anchor = "bottom";
			inset = bottomLimit - above;
		} else {
			// A target this tall leaves no clear side, so the tooltip has to
			// overlap it. Cover the end furthest from the target's start, which
			// keeps its heading — the part the tooltip talks about — visible.
			const targetMiddle = padded.y + padded.height / 2;
			const bandMiddle = (topLimit + bottomLimit) / 2;
			anchor = targetMiddle <= bandMiddle ? "bottom" : "top";
		}
	}

	return (
		<Animated.View
			style={styles.root}
			entering={FadeIn.duration(260)}
			accessibilityViewIsModal
		>
			{/* Tapping anywhere advances. Hidden from assistive tech, which uses
			    the labelled buttons in the tooltip instead. */}
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={next}
				accessible={false}
				importantForAccessibility="no"
			/>

			<Animated.View style={[styles.dim, topPanelStyle]} pointerEvents="none" />
			<Animated.View
				style={[styles.dim, bottomPanelStyle]}
				pointerEvents="none"
			/>
			<Animated.View style={[styles.dim, leftPanelStyle]} pointerEvents="none" />
			<Animated.View
				style={[styles.dim, rightPanelStyle]}
				pointerEvents="none"
			/>

			<Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />

			{/* Spans the safe band so the tooltip can be anchored to either edge
			    with flexbox. box-none keeps taps outside the tooltip falling
			    through to the Pressable behind it. */}
			<View
				pointerEvents="box-none"
				style={[
					styles.tooltipBand,
					{
						top: topLimit,
						bottom: windowHeight - bottomLimit,
						justifyContent:
							anchor === "center"
								? "center"
								: anchor === "top"
									? "flex-start"
									: "flex-end",
					},
				]}
			>
				{/* Remounted per step so the fade-in hides the reposition that
				    follows measuring this step's height. */}
				<Animated.View
					key={step.id}
					entering={FadeIn.duration(220)}
					onLayout={handleTooltipLayout}
					style={[
						styles.tooltip,
						anchor === "top" && { marginTop: Math.max(0, inset) },
						anchor === "bottom" && { marginBottom: Math.max(0, inset) },
					]}
				>
					<Text className="font-tajawal-bold text-warmBrown text-xl text-center mb-2">
						{step.title}
					</Text>
					<Text className="font-tajawal text-warmBrownLight text-base text-center leading-7">
						{step.body}
					</Text>

					<View className="h-[0.5px] bg-warmGold/25 my-4" />

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
							className="py-2"
						>
							<Text className="font-tajawal text-warmBrownMuted text-sm underline">
								تخطي الشرح
							</Text>
						</TouchableOpacity>

						<View className="flex-row items-center gap-2">
							{!isFirstStep && (
								<TouchableOpacity
									onPress={back}
									accessibilityRole="button"
									accessibilityLabel="الخطوة السابقة"
									className="w-10 h-10 rounded-xl items-center justify-center border border-warmGold/30"
								>
									<Ionicons
										name="chevron-forward"
										size={18}
										color={palette.warmGold}
									/>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								onPress={next}
								accessibilityRole="button"
								accessibilityLabel={
									isLastStep ? "إنهاء الشرح" : "الخطوة التالية"
								}
								className="bg-warmGold px-5 h-10 rounded-xl items-center justify-center"
							>
								<Text className="font-tajawal-bold text-white text-base">
									{isLastStep ? "ابدأ" : "التالي"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	root: {
		...StyleSheet.absoluteFillObject,
		zIndex: 3000,
	},
	dim: {
		position: "absolute",
		backgroundColor: "rgba(0,0,0,0.62)",
	},
	ring: {
		position: "absolute",
		borderRadius: 18,
		borderWidth: 2,
		borderColor: palette.warmGold,
	},
	tooltipBand: {
		position: "absolute",
		// Symmetric insets, so the RTL start/end rewrite cannot shift them.
		left: TOOLTIP_MARGIN,
		right: TOOLTIP_MARGIN,
	},
	tooltip: {
		backgroundColor: palette.parchmentLight,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(196, 164, 108, 0.35)",
		paddingHorizontal: 20,
		paddingVertical: 18,
		shadowColor: palette.black,
		shadowOpacity: 0.18,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 6 },
		elevation: 8,
	},
});
