import { ArabicText } from "@/components/ui/ArabicText";
import { palette } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

export function RoutineMenu({
  title,
  onClose,
  onAlreadyDoing,
  onPostpone,
}: {
  title: string;
  onClose: () => void;
  onAlreadyDoing: () => void;
  onPostpone: () => void;
}) {
  return (
    <ScrollView>
      <ArabicText
        accessibilityRole="header"
        className="font-tajawal-bold text-warmBrown text-lg leading-8 mb-4"
      >
        {title}
      </ArabicText>
      {[
        {
          title: "أفعل هذه السنن بالفعل",
          body: "إضافتها جميعاً إلى إنجازاتك",
          icon: "checkmark-circle-outline" as const,
          action: onAlreadyDoing,
        },
        {
          title: "تأجيل هذه السنن",
          body: "العودة إليها لاحقاً وبدء العدّ من جديد",
          icon: "time-outline" as const,
          action: onPostpone,
        },
      ].map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={item.action}
          className="flex-row items-center gap-3 py-4 border-t border-warmGold/20"
          style={{ direction: "rtl" }}
        >
          <Ionicons name={item.icon} size={24} color={palette.warmBrownLight} />
          <View className="flex-1">
            <ArabicText className="font-tajawal-bold text-warmBrown text-base leading-7">
              {item.title}
            </ArabicText>
            <ArabicText className="font-tajawal text-warmBrownMuted text-sm leading-6">
              {item.body}
            </ArabicText>
          </View>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        className="min-h-11 items-center justify-center mt-3 rounded-xl bg-warmGold/10"
      >
        <ArabicText className="font-tajawal-bold text-warmBrownLight text-base">
          إغلاق
        </ArabicText>
      </Pressable>
    </ScrollView>
  );
}
