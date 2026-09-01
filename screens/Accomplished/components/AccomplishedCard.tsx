import { palette } from "@/constants/theme";
import { AccomplishedRecord, Sunnah } from "@/types";
import { formatArabicDate } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View } from "react-native";

const METHOD_LABELS: Record<string, string> = {
  streak: "سبعة أيام متتالية",
  already_doing: "كنت أفعلها",
};

export function AccomplishedCard({
  item,
  record,
}: {
  item: Sunnah;
  record?: AccomplishedRecord;
}) {
  const methodLabel = record?.method ? METHOD_LABELS[record.method] : "مكتملة";
  const dateLabel = record?.completedAt
    ? formatArabicDate(record.completedAt)
    : null;

  return (
    <View className="w-full mb-4 rounded-2xl shadow-sm shadow-warmBrown/10 overflow-hidden bg-parchmentLight border border-warmGold/20">
      <Image
        source={require("@/assets/images/top-right-decorations.png")}
        className="absolute top-[-5] left-0 w-[90px] h-[90px] opacity-60"
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/bottome-left-decorations.png")}
        className="absolute bottom-[-10] right-0 w-[90px] h-[90px] opacity-60"
        resizeMode="contain"
      />

      <View className="px-5 pt-5 pb-4">
        <View className="self-center flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-warmGold/15 border border-warmGold/30 mb-3">
          <Ionicons name="checkmark" size={13} color={palette.warmGold} />
          <Text className="font-tajawal text-warmGold text-[12px]">
            {methodLabel}
          </Text>
        </View>

        <Text
          className="font-tajawal-bold text-[18px] text-warmBrown leading-7 text-center mb-1.5"
          style={{ writingDirection: "rtl" }}
        >
          {item.title}
        </Text>

        {item.action && (
          <Text
            className="font-tajawal text-[14px] text-warmBrownLight leading-6 text-center"
            style={{ writingDirection: "rtl" }}
            numberOfLines={2}
          >
            {item.action}
          </Text>
        )}

        {dateLabel && (
          <Text className="font-tajawal text-warmBrownMuted text-[12px] text-center mt-3">
            {dateLabel}
          </Text>
        )}
      </View>
    </View>
  );
}
