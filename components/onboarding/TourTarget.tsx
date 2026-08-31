import {
	TourMeasurable,
	useOnboarding,
} from "@/context/OnboardingContext";
import React, { useCallback } from "react";
import { View, ViewStyle } from "react-native";
import { TourTargetKey } from "./steps";

/**
 * Callback ref that registers a node as a spotlight target. Attach it directly
 * to the element being explained so the measured frame matches what the user
 * sees — an extra wrapper view would swallow the child's margins.
 */
export function useTourTarget(tourKey: TourTargetKey) {
	const { registerTarget } = useOnboarding();

	return useCallback(
		(node: TourMeasurable | null) => {
			registerTarget(tourKey, node);
		},
		[registerTarget, tourKey],
	);
}

interface TourTargetProps {
	tourKey: TourTargetKey;
	children: React.ReactNode;
	className?: string;
	style?: ViewStyle;
}

/** Wrapper for targets that cannot take a ref of their own. */
export function TourTarget({
	tourKey,
	children,
	className,
	style,
}: TourTargetProps) {
	const setTargetRef = useTourTarget(tourKey);

	return (
		<View
			ref={setTargetRef}
			collapsable={false}
			className={className}
			style={style}
		>
			{children}
		</View>
	);
}
