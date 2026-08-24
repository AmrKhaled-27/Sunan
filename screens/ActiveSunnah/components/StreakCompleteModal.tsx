import { Button } from "@/components/ui/Button";
import { palette } from "@/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ConfettiCanvas, useConfetti } from "react-native-confetti-reanimated";

interface StreakCompleteModalProps {
	visible: boolean;
	sunnahTitle: string;
	onClose: () => void;
}

const CONFETTI_COLORS = [
	palette.warmGold,
	palette.goldAccent,
	palette.oliveGreen,
	palette.sageGreen,
	palette.warmGoldLight,
	palette.mutedGold,
];

// Rendered as a plain absolutely-positioned overlay instead of RN's <Modal>:
// Android's Modal is backed by a native Dialog that clips any child content
// overflowing its own measured bounds. ConfettiCanvas is kept always mounted
// so its ref/worklet state stays stable across visibility toggles; only the
// card overlay is conditionally shown.
export function StreakCompleteModal({ visible, sunnahTitle, onClose }: StreakCompleteModalProps) {
	const { confettiRef, fire, reset } = useConfetti();

	useEffect(() => {
		if (visible) {
			fire({
				particleCount: 200,
				spread: 100,
				startVelocity: 30,
				origin: { x: 0.5, y: 0.25 },
				colors: CONFETTI_COLORS,
				shapes: ["square", "circle", "star"],
			});
		} else {
			reset();
		}
	}, [visible, fire, reset]);

	return (
		<>
			<View style={styles.canvasLayer} pointerEvents="none">
				<ConfettiCanvas ref={confettiRef} fullScreen zIndex={2000} />
			</View>

			{visible && (
				<View style={styles.root} pointerEvents="box-none">
					<View style={styles.backdrop} />

					<View style={styles.content} pointerEvents="box-none">
						<View style={styles.card}>
							<Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-3">
								مبارك!
							</Text>
							<Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8 mb-6">
								{`أتممت 7 أيام متتالية لسنة «${sunnahTitle}». جزاك الله خيراً`}
							</Text>
							<Button
								title="متابعة"
								onPress={onClose}
								color={palette.oliveGreen}
								colorEnd={palette.oliveGreenDark}
								textColor={palette.white}
							/>
						</View>
					</View>
				</View>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	canvasLayer: {
		...StyleSheet.absoluteFillObject,
		zIndex: 2000,
	},
	root: {
		...StyleSheet.absoluteFillObject,
		zIndex: 1000,
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.4)",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},
	card: {
		backgroundColor: palette.parchmentLight,
		borderRadius: 16,
		padding: 24,
		width: "100%",
	},
});
