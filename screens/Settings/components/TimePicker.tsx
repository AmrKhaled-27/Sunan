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

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-parchmentLight rounded-2xl p-6 w-full">
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-6">
            اختر وقت التذكير
          </Text>

          {/* Hour */}
          <Text className="font-tajawal text-warmBrownLight text-center mb-2">
            الساعة
          </Text>
          <View className="flex-row justify-center items-center gap-4 mb-5">
            <TouchableOpacity
              onPress={() => setH((prev) => (prev - 1 + 24) % 24)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-4xl w-16 text-center">
              {pad(h)}
            </Text>
            <TouchableOpacity
              onPress={() => setH((prev) => (prev + 1) % 24)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          {/* Minute */}
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
