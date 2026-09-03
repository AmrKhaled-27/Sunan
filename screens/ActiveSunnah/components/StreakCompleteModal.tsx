import { palette } from "@/constants/theme";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
export function StreakCompleteModal({
  visible,
  sunnahTitle,
  onClose,
}: StreakCompleteModalProps) {
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
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessible={false}
          />

          <View style={styles.content} pointerEvents="box-none">
            <View style={styles.card}>
              <Text className="font-tajawal-bold text-warmBrown text-lg text-center mb-1.5">
                مبارك!
              </Text>
              <Text className="font-tajawal text-warmBrownLight text-sm text-center leading-6">
                {`أتممت 7 أيام متتالية لسنة «${sunnahTitle}». جزاك الله خيراً`}
              </Text>

              <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="متابعة"
                className="bg-warmGold h-10 rounded-xl items-center justify-center shadow-sm"
              >
                <Text className="font-tajawal-bold text-white text-sm">
                  متابعة
                </Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: palette.parchmentLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(196, 164, 108, 0.35)",
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: "100%",
    maxWidth: 380,
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});

