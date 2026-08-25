import { formatTime12h } from "@/utils/date";
import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

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
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-parchmentLight rounded-2xl p-6 w-full">
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-2">
            اختر وقت التذكير
          </Text>

          {/* Live 12-hour Preview Badge */}
          <View className="items-center mb-5">
            <View className="bg-warmGold/15 border border-warmGold/30 px-5 py-2 rounded-xl">
              <Text className="font-tajawal-bold text-warmGold text-2xl">
                {formatTime12h(h, m)}
              </Text>
            </View>
          </View>

          {/* AM / PM Period Selector */}
          <View className="flex-row justify-center gap-3 mb-5">
            <TouchableOpacity
              onPress={() => togglePeriod(false)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                !isPm
                  ? "bg-warmGold border-warmGold"
                  : "bg-warmGold/10 border-warmGold/30"
              }`}
            >
              <Text
                className={`font-tajawal-bold text-base ${
                  !isPm ? "text-white" : "text-warmBrown"
                }`}
              >
                صباحاً (ص)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => togglePeriod(true)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                isPm
                  ? "bg-warmGold border-warmGold"
                  : "bg-warmGold/10 border-warmGold/30"
              }`}
            >
              <Text
                className={`font-tajawal-bold text-base ${
                  isPm ? "text-white" : "text-warmBrown"
                }`}
              >
                مساءً (م)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hour (1 - 12) */}
          <Text className="font-tajawal text-warmBrownLight text-center mb-2">
            الساعة
          </Text>
          <View className="flex-row justify-center items-center gap-4 mb-5">
            <TouchableOpacity
              onPress={() => adjustHour(-1)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-4xl w-16 text-center">
              {pad(h12)}
            </Text>
            <TouchableOpacity
              onPress={() => adjustHour(1)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          {/* Minute (00, 15, 30, 45) */}
          <Text className="font-tajawal text-warmBrownLight text-center mb-2">
            الدقيقة
          </Text>
          <View className="flex-row justify-center items-center gap-4 mb-6">
            <TouchableOpacity
              onPress={() => setM((prev) => (prev === 0 ? 45 : prev - 15))}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-4xl w-16 text-center">
              {pad(m)}
            </Text>
            <TouchableOpacity
              onPress={() => setM((prev) => (prev + 15) % 60)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => onConfirm(h, m)}
            className="bg-warmGold rounded-xl py-3 mb-3 items-center"
          >
            <Text className="font-tajawal-bold text-white text-xl">تأكيد</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="items-center py-2">
            <Text className="font-tajawal text-warmBrownLight text-base">
              إلغاء
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

