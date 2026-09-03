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
} from "react-native";

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
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessible={false}
        />
        <View style={[styles.card, style]} className={className}>
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

