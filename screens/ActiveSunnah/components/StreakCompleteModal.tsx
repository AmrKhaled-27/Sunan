import { ArabicText } from "@/components/ui/ArabicText";
import { palette } from "@/constants/theme";
import React, { useEffect } from "react";
import {
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfettiCanvas, useConfetti } from "react-native-confetti-reanimated";

interface StreakCompleteModalProps {
  visible: boolean;
  routineTitle: string;
  memberTitles: string[];
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

// The canvas occupies the full modal window so confetti isn't clipped to the
// card. A native modal blocks the underlying page and tabs, including Android back.
export function StreakCompleteModal({
  visible,
  routineTitle,
  memberTitles,
  onClose,
}: StreakCompleteModalProps) {
  const { confettiRef, fire, reset } = useConfetti();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const celebrate = () =>
    fire({
      particleCount: 200,
      spread: 100,
      startVelocity: 30,
      origin: { x: 0.5, y: 0.25 },
      colors: CONFETTI_COLORS,
      shapes: ["square", "circle", "star"],
    });

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
      onShow={celebrate}
    >
      <View
        style={{ flex: 1 }}
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
      >
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

            <View
              style={[
                styles.content,
                {
                  paddingTop: insets.top + 16,
                  paddingBottom: insets.bottom + 16,
                  paddingHorizontal: Math.max(20, insets.left, insets.right),
                },
              ]}
              pointerEvents="box-none"
            >
              <View style={styles.card}>
                <ScrollView>
                  <ArabicText
                    align="center"
                    className="font-tajawal-bold text-warmBrown text-lg mb-1.5"
                  >
                    مبارك!
                  </ArabicText>
                  <ArabicText
                    align="center"
                    className="font-tajawal text-warmBrownLight text-sm leading-6"
                  >
                    {`أتممت ٧ أيام متتالية مع «${routineTitle}». جزاك الله خيراً، وأعانك على المداومة.`}
                  </ArabicText>
                  <ArabicText
                    align="center"
                    className="font-tajawal-bold text-warmBrown text-sm mt-4 mb-2"
                  >
                    أُضيفت إلى إنجازاتك
                  </ArabicText>
                  {memberTitles.map((title) => (
                    <ArabicText
                      key={title}
                      className="font-tajawal text-warmBrownLight text-base leading-7"
                    >
                      ✓ {title}
                    </ArabicText>
                  ))}

                  <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

                  <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="متابعة"
                    className="bg-warmGold min-h-11 py-3 rounded-xl items-center justify-center shadow-sm"
                  >
                    <ArabicText className="font-tajawal-bold text-white text-sm">
                      متابعة
                    </ArabicText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
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
    maxHeight: "100%",
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
