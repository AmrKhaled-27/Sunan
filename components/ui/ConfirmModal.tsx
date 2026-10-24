import { ArabicText } from "@/components/ui/ArabicText";
import { palette } from "@/constants/theme";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { BaseModal } from "./BaseModal";

export interface ConfirmModalProps {
  visible: boolean;
  embedded?: boolean;
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
  embedded = false,
  title,
  description,
  confirmText,
  cancelText = "رجوع",
  confirmColor = palette.warmGold,
  confirmTextColor = palette.white,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const content = (
    <ScrollView>
      <ArabicText
        align="center"
        className="font-tajawal-bold text-warmBrown text-lg mb-1.5"
      >
        {title}
      </ArabicText>
      <ArabicText
        align="center"
        className="font-tajawal text-warmBrownLight text-sm leading-6"
      >
        {description}
      </ArabicText>

      <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={cancelText}
          className="min-h-11 py-3 px-2"
        >
          <ArabicText className="font-tajawal text-warmBrownMuted text-xs underline">
            {cancelText}
          </ArabicText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={confirmText}
          style={{ backgroundColor: confirmColor }}
          className="px-4 py-3 min-h-11 rounded-xl items-center justify-center shadow-sm"
        >
          <ArabicText
            className="font-tajawal-bold text-sm"
            style={{ color: confirmTextColor }}
          >
            {confirmText}
          </ArabicText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  return embedded ? (
    content
  ) : (
    <BaseModal visible={visible} onClose={onClose}>
      {content}
    </BaseModal>
  );
}
