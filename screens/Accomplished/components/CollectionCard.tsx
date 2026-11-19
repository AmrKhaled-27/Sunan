import { ArabicText } from "@/components/ui/ArabicText";
import { palette } from "@/constants/theme";
import {
  AchievementCollection,
  AchievementItem,
  toArabicDigits,
} from "@/utils/achievements";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, View } from "react-native";
import { achievementStatusLabel } from "./achievementLabels";

function SunnahRow({
  item,
  first,
  onPress,
}: {
  item: AchievementItem;
  first: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.sunnah.title}
      accessibilityHint="عرض السنة كاملة مع الدليل"
      className={`flex-row items-center gap-3 py-3 px-2 -mx-2 rounded-xl active:bg-warmGold/10 ${
        first ? "" : "border-t border-warmGold/15"
      }`}
      style={{ direction: "rtl" }}
    >
      <View className="w-7 h-7 rounded-full bg-warmGold/15 items-center justify-center">
        <Ionicons name="checkmark" size={15} color={palette.warmGold} />
      </View>
      <View className="flex-1">
        <ArabicText
          className="font-tajawal-bold text-warmBrown text-[16px] leading-6"
          numberOfLines={2}
        >
          {item.sunnah.title}
        </ArabicText>
        <ArabicText
          className="font-tajawal text-warmBrownMuted text-[12px] leading-5 mt-0.5"
          numberOfLines={1}
        >
          {achievementStatusLabel(item.record)}
        </ArabicText>
      </View>
      <Ionicons name="chevron-back" size={18} color={palette.warmBrownSubtle} />
    </Pressable>
  );
}

export function CollectionCard({
  collection,
  onSelect,
}: {
  collection: AchievementCollection;
  onSelect: (item: AchievementItem, context: string) => void;
}) {
  const { title, parts, completedCount, totalCount } = collection;
  const complete = completedCount >= totalCount;
  const progress = totalCount ? completedCount / totalCount : 1;

  return (
    <View className="w-full mb-4 rounded-2xl shadow-sm shadow-warmBrown/10 overflow-hidden bg-parchmentLight border border-warmGold/20">
      <Image
        source={require("@/assets/images/top-right-decorations.png")}
        className="absolute top-[-5] left-0 w-[90px] h-[90px] opacity-40"
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/bottome-left-decorations.png")}
        className="absolute bottom-[-10] right-0 w-[90px] h-[90px] opacity-40"
        resizeMode="contain"
      />

      <View className="px-5 pt-5 pb-3">
        <View
          className="flex-row items-center gap-3"
          style={{ direction: "rtl" }}
        >
          <ArabicText
            accessibilityRole="header"
            className="flex-1 font-tajawal-bold text-warmBrown text-[19px] leading-8"
          >
            {title}
          </ArabicText>
          <View
            className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-warmGold/15 border border-warmGold/30"
            style={{ direction: "rtl" }}
            accessibilityLabel={`${completedCount} من ${totalCount}`}
          >
            {complete ? (
              <Ionicons
                name="ribbon-outline"
                size={13}
                color={palette.warmGold}
              />
            ) : null}
            <ArabicText className="font-tajawal-bold text-warmGold text-[12px]">
              {complete
                ? "مكتملة"
                : `${toArabicDigits(completedCount)} من ${toArabicDigits(totalCount)}`}
            </ArabicText>
          </View>
        </View>

        <View
          className="h-1.5 rounded-full bg-warmGold/15 overflow-hidden mt-3 mb-1"
          style={{ direction: "rtl" }}
        >
          <View
            className="h-full rounded-full bg-warmGold"
            style={{
              width: `${Math.round(progress * 100)}%`,
              alignSelf: "flex-start",
            }}
          />
        </View>

        {parts.map((part, partIndex) => {
          const context = part.label ? `${title} · ${part.label}` : title;
          return (
            <View key={part.key} className={part.label ? "mt-4" : "mt-2"}>
              {part.label ? (
                <View
                  className="flex-row items-center gap-2 mb-1"
                  style={{ direction: "rtl" }}
                >
                  {part.number ? (
                    <View className="min-w-6 h-6 px-1.5 rounded-full border border-warmGold/40 items-center justify-center">
                      <ArabicText
                        align="center"
                        className="font-tajawal-bold text-warmGold text-[12px]"
                      >
                        {toArabicDigits(part.number)}
                      </ArabicText>
                    </View>
                  ) : null}
                  <ArabicText className="flex-1 font-tajawal-bold text-warmBrownLight text-[14px]">
                    {part.label}
                  </ArabicText>
                </View>
              ) : null}
              {part.items.map((item, index) => (
                <SunnahRow
                  key={item.sunnah.id}
                  item={item}
                  first={index === 0 && (!!part.label || partIndex === 0)}
                  onPress={() => onSelect(item, context)}
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}
