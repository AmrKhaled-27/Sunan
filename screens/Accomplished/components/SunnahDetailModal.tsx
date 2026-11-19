import { HadithEvidenceCard } from "@/components/sunnah/HadithEvidenceCard";
import { ArabicText } from "@/components/ui/ArabicText";
import { BaseModal } from "@/components/ui/BaseModal";
import { palette } from "@/constants/theme";
import { AccomplishedRecord, Sunnah } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { achievementStatusLabel } from "./achievementLabels";

function SectionLabel({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: string;
}) {
  return (
    <View
      className="flex-row items-center gap-2 mb-3"
      style={{ direction: "rtl" }}
    >
      <Ionicons name={icon} size={16} color={palette.warmGold} />
      <ArabicText
        accessibilityRole="header"
        className="font-tajawal-bold text-warmBrown text-base"
      >
        {children}
      </ArabicText>
    </View>
  );
}

export function SunnahDetailModal({
  visible,
  sunnah,
  record,
  context,
  onClose,
}: {
  visible: boolean;
  sunnah: Sunnah | null;
  record?: AccomplishedRecord;
  context?: string;
  onClose: () => void;
}) {
  if (!sunnah) return null;
  const status = achievementStatusLabel(record);
  const reward = sunnah.reward?.trim();

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      style={{ maxWidth: 620, paddingHorizontal: 0, paddingVertical: 0 }}
    >
      <View
        className="flex-row items-start gap-3 px-5 pt-5 pb-4 border-b border-warmGold/25"
        style={{ direction: "rtl" }}
      >
        <View className="flex-1">
          {context ? (
            <ArabicText className="font-tajawal text-warmBrownMuted text-xs leading-5 mb-1">
              {context}
            </ArabicText>
          ) : null}
          <ArabicText
            accessibilityRole="header"
            className="font-tajawal-bold text-warmBrown text-xl leading-8"
          >
            {sunnah.title}
          </ArabicText>
          <View
            className="self-start flex-row items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-warmGold/15 border border-warmGold/30"
            style={{ direction: "rtl" }}
          >
            <Ionicons name="checkmark" size={13} color={palette.warmGold} />
            <ArabicText className="font-tajawal text-warmGold text-xs">
              {status}
            </ArabicText>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
          className="w-11 h-11 rounded-full bg-warmGold/10 items-center justify-center"
        >
          <Ionicons name="close" size={24} color={palette.warmBrown} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flexGrow: 0, flexShrink: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        <SectionLabel icon="leaf-outline">كيف تطبّقها</SectionLabel>
        <View className="bg-parchmentPure rounded-2xl border border-warmGold/20 p-4 mb-6">
          <ArabicText
            selectable
            className="font-amiri text-warmBrown text-xl leading-10"
          >
            {sunnah.action}
          </ArabicText>
        </View>

        {reward ? (
          <View className="bg-warmGold/10 border border-warmGold/30 rounded-2xl p-4 mb-6">
            <SectionLabel icon="sparkles-outline">الفضل والثواب</SectionLabel>
            <ArabicText className="font-amiri text-warmBrown text-xl leading-9">
              {reward}
            </ArabicText>
          </View>
        ) : null}

        {sunnah.hadiths.length ? (
          <>
            <SectionLabel icon="book-outline">الدليل</SectionLabel>
            {sunnah.hadiths.map((hadith, index) => (
              <HadithEvidenceCard
                key={`${sunnah.id}:${hadith.id ?? index}`}
                hadith={hadith}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </BaseModal>
  );
}
