import { useOnboarding } from "@/context/OnboardingContext";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Narrow enough that a mirrored marker lands unmistakably far from x = 0. */
export const MIRROR_MARKER_WIDTH = 8;

/**
 * Invisible calibration views for the spotlight overlay. Must be rendered as a
 * sibling of SpotlightOverlay so both share a coordinate origin.
 *
 * The outer view resolves where the overlay's origin sits in the coordinate
 * space that measureInWindow reports: Android measures relative to the visible
 * window frame, which excludes the status bar, while the overlay lives in the
 * edge-to-edge root view.
 *
 * The inner marker resolves whether React Native mirrors the `left` inset. It
 * asks for `left: 0`, so measuring where it actually landed reveals whether
 * `left` was rewritten to the layout's start edge, as happens in an RTL app.
 */
export function TourOriginProbe() {
	const { registerOriginProbe, registerMirrorMarker } = useOnboarding();

	return (
		<View
			ref={registerOriginProbe}
			collapsable={false}
			pointerEvents="none"
			style={StyleSheet.absoluteFill}
		>
			<View
				ref={registerMirrorMarker}
				collapsable={false}
				style={styles.marker}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	marker: {
		position: "absolute",
		top: 0,
		left: 0,
		width: MIRROR_MARKER_WIDTH,
		height: 1,
	},
});
