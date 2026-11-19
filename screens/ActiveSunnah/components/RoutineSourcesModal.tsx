import { HadithEvidenceCard } from "@/components/sunnah/HadithEvidenceCard";
import { ArabicText } from "@/components/ui/ArabicText";
import { BaseModal } from "@/components/ui/BaseModal";
import { palette } from "@/constants/theme";
import { Sunnah } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function RoutineSourcesModal({
  visible,
  title,
  members,
  onClose,
}: {
  visible: boolean;
  title: string;
  members: Sunnah[];
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      style={{
        maxWidth: 620,
        height: (height - insets.top - insets.bottom - 32) * 0.92,
        paddingHorizontal: 0,
        paddingVertical: 0,
      }}
    >
      <View
        className="flex-row items-start gap-3 px-5 pt-5 pb-4 border-b border-warmGold/25"
        style={{ direction: "rtl" }}
      >
        <View className="flex-1">
          <ArabicText
            accessibilityRole="header"
            className="font-tajawal-bold text-warmBrown text-xl"
          >
            مصادر سنن اليوم
          </ArabicText>
          <ArabicText className="font-tajawal text-warmBrownLight text-sm leading-6 mt-1">
            {title}
          </ArabicText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق المصادر"
          className="w-11 h-11 rounded-full bg-warmGold/10 items-center justify-center"
        >
          <Ionicons name="close" size={24} color={palette.warmBrown} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
        style={{ flex: 1 }}
      >
        {members.map((member, memberIndex) => (
          <View key={member.id} className={memberIndex ? "mt-7" : ""}>
            <ArabicText
              accessibilityRole="header"
              className="font-tajawal-bold text-warmBrown text-lg leading-8 mb-3"
            >
              {member.title}
            </ArabicText>
            {member.hadiths.map((hadith, index) => (
              <HadithEvidenceCard
                key={`${member.id}:${hadith.id ?? index}`}
                hadith={hadith}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </BaseModal>
  );
}
