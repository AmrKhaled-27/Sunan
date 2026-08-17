import React from "react";
import { Modal, Text, View } from "react-native";
import { palette } from "@/constants/theme";
import { Button } from "./Button";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  confirmColor?: string;
  confirmColorEnd?: string;
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
  confirmColor = palette.oliveGreen,
  confirmColorEnd,
  confirmTextColor = palette.white,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-parchmentLight rounded-2xl p-6 w-full">
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-3">
            {title}
          </Text>
          <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8 mb-6">
            {description}
          </Text>
          <Button
            title={confirmText}
            onPress={onConfirm}
            color={confirmColor}
            colorEnd={confirmColorEnd}
            textColor={confirmTextColor}
          />
          <Button
            title={cancelText}
            onPress={onClose}
            variant="ghost"
            color={palette.warmBrownSubtle}
          />
        </View>
      </View>
    </Modal>
  );
}
