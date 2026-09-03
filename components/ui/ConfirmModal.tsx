import { palette } from "@/constants/theme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { BaseModal } from "./BaseModal";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  confirmColor?: string;
  confirmTextColor?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  visible,
  title,
  description,
  confirmText,
  cancelText = "رجوع",
  confirmColor = palette.warmGold,
  confirmTextColor = palette.white,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text className="font-tajawal-bold text-warmBrown text-lg text-center mb-1.5">
        {title}
      </Text>
      <Text className="font-tajawal text-warmBrownLight text-sm text-center leading-6">
        {description}
      </Text>

      <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

      <View className="flex-row items-center justify-between gap-3">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={cancelText}
          className="py-1.5 px-1"
        >
          <Text className="font-tajawal text-warmBrownMuted text-xs underline">
            {cancelText}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={confirmText}
          style={{ backgroundColor: confirmColor }}
          className="px-4 h-9 rounded-xl items-center justify-center shadow-sm"
        >
          <Text
            className="font-tajawal-bold text-sm"
            style={{ color: confirmTextColor }}
          >
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
