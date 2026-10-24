import { palette } from "@/constants/theme";
import React from "react";
import {
  Modal,
  ModalProps,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  animationType?: ModalProps["animationType"];
}

/**
 * Reusable modal shell styled after the onboarding explaining modal:
 * warm parchment surface, 1px gold accent border, soft shadow,
 * and deep dimming backdrop with click-to-dismiss behavior.
 */
export function BaseModal({
  visible,
  onClose,
  children,
  dismissible = true,
  className = "",
  style,
  animationType = "fade",
}: BaseModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const handleDismiss = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      animationType={animationType}
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: Math.max(20, insets.left, insets.right),
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessible={false}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={handleDismiss}
          style={[
            styles.card,
            { maxHeight: height - insets.top - insets.bottom - 32 },
            style,
          ]}
          className={className}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    direction: "rtl",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: palette.parchmentLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(196, 164, 108, 0.35)",
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    direction: "rtl",
  },
});
