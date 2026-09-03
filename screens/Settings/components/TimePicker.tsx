import { BaseModal } from "@/components/ui/BaseModal";
import { formatTime12h } from "@/utils/date";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function TimePicker({
  visible,
  hour,
  minute,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  // Sync internal state with props whenever the modal is shown
  useEffect(() => {
    if (visible) {
      setH(hour);
      setM(minute);
    }
  }, [visible, hour, minute]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;

  const togglePeriod = (targetPm: boolean) => {
    if (targetPm && !isPm) {
      setH((prev) => prev + 12);
    } else if (!targetPm && isPm) {
      setH((prev) => prev - 12);
    }
  };

  const adjustHour = (delta: number) => {
    setH((prev) => {
      const currentPeriod = prev >= 12;
      const currentH12 = prev % 12;
      // Calculate new 12-hour value (0 to 11 internally)
      let nextH12 = (currentH12 + delta) % 12;
      if (nextH12 < 0) nextH12 += 12;
      return nextH12 + (currentPeriod ? 12 : 0);
    });
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text className="font-tajawal-bold text-warmBrown text-lg text-center mb-2">
        اختر وقت التذكير
      </Text>

      {/* Live 12-hour Preview Badge */}
      <View className="items-center mb-3">
        <View className="bg-warmGold/15 border border-warmGold/30 px-4 py-1.5 rounded-xl">
          <Text className="font-tajawal-bold text-warmGold text-xl">
            {formatTime12h(h, m)}
          </Text>
        </View>
      </View>

      {/* AM / PM Period Selector */}
      <View className="flex-row justify-center gap-2.5 mb-3.5">
        <TouchableOpacity
          onPress={() => togglePeriod(false)}
          className={`flex-1 py-1.5 rounded-xl border items-center ${
            !isPm
              ? "bg-warmGold border-warmGold"
              : "bg-warmGold/10 border-warmGold/30"
          }`}
        >
          <Text
            className={`font-tajawal-bold text-xs ${
              !isPm ? "text-white" : "text-warmBrown"
            }`}
          >
            صباحاً (ص)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => togglePeriod(true)}
          className={`flex-1 py-1.5 rounded-xl border items-center ${
            isPm
              ? "bg-warmGold border-warmGold"
              : "bg-warmGold/10 border-warmGold/30"
          }`}
        >
          <Text
            className={`font-tajawal-bold text-xs ${
              isPm ? "text-white" : "text-warmBrown"
            }`}
          >
            مساءً (م)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hour & Minute adjustments side by side */}
      <View className="flex-row items-center justify-around mb-1">
        {/* Hour */}
        <View className="items-center">
          <Text className="font-tajawal text-warmBrownLight text-xs mb-1">
            الساعة
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => adjustHour(-1)}
              className="w-8 h-8 rounded-lg bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-base font-bold">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-2xl w-10 text-center">
              {pad(h12)}
            </Text>
            <TouchableOpacity
              onPress={() => adjustHour(1)}
              className="w-8 h-8 rounded-lg bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-base font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View className="w-[0.5px] h-9 bg-warmGold/25 mx-1" />

        {/* Minute */}
        <View className="items-center">
          <Text className="font-tajawal text-warmBrownLight text-xs mb-1">
            الدقيقة
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setM((prev) => (prev === 0 ? 45 : prev - 15))}
              className="w-8 h-8 rounded-lg bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-base font-bold">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-2xl w-10 text-center">
              {pad(m)}
            </Text>
            <TouchableOpacity
              onPress={() => setM((prev) => (prev + 15) % 60)}
              className="w-8 h-8 rounded-lg bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-base font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="h-[0.5px] bg-warmGold/25 my-3.5" />

      <View className="flex-row items-center justify-between gap-3">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إلغاء"
          className="py-1.5 px-1"
        >
          <Text className="font-tajawal text-warmBrownMuted text-xs underline">
            إلغاء
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onConfirm(h, m)}
          accessibilityRole="button"
          accessibilityLabel="تأكيد"
          className="bg-warmGold px-5 h-9 rounded-xl items-center justify-center shadow-sm"
        >
          <Text className="font-tajawal-bold text-white text-sm">تأكيد</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
