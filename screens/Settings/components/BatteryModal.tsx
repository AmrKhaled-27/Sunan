import { BaseModal } from "@/components/ui/BaseModal";
import { palette } from "@/constants/theme";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

interface BatteryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BatteryModal({ visible, onClose }: BatteryModalProps) {
  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.warn("Could not open settings", e);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text className="font-tajawal-bold text-warmBrown text-lg text-center mb-1.5">
        ضمان وصول التنبيهات
      </Text>
      <Text className="font-tajawal text-warmBrownLight text-sm text-center leading-6 mb-3">
        لضمان وصول التذكيرات في وقتها المحدد دون تأخير من الهاتف:
      </Text>

      <View className="bg-warmGold/10 rounded-xl p-3.5 mb-1 border border-warmGold/20 gap-2.5">
        <Text
          style={{ writingDirection: "rtl" }}
          className="font-tajawal-bold text-warmBrown text-xs leading-5"
        >
          <Text className="text-warmGold">١. </Text>
          اضغط الزر أدناه لفتح صفحة التطبيق
        </Text>

        <Text
          style={{ writingDirection: "rtl" }}
          className="font-tajawal-bold text-warmBrown text-xs leading-5"
        >
          <Text className="text-warmGold">٢. </Text>
          ادخل على «البطارية» (Battery)
        </Text>

        <Text
          style={{ writingDirection: "rtl" }}
          className="font-tajawal-bold text-warmBrown text-xs leading-5"
        >
          <Text className="text-warmGold">٣. </Text>
          غيّر الإعداد إلى «غير مقيّد» (Unrestricted)
        </Text>
      </View>

      <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

      <View className="flex-row items-center justify-between gap-3">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
          className="py-1.5 px-1"
        >
          <Text className="font-tajawal text-warmBrownMuted text-xs underline">
            إغلاق
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            onClose();
            handleOpenSettings();
          }}
          accessibilityRole="button"
          accessibilityLabel="فتح إعدادات التطبيق"
          className="bg-warmGold px-4 h-9 rounded-xl items-center justify-center shadow-sm"
        >
          <Text className="font-tajawal-bold text-white text-sm">
            فتح إعدادات التطبيق
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
