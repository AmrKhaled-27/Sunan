import { ArabicText } from "@/components/ui/ArabicText";
import { palette } from "@/constants/theme";
import { Sunnah } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

export function RoutineRewardsPanel({ members }: { members: Sunnah[] }) {
  const [expanded, setExpanded] = useState(false);
  const rewards = members.filter((member) => member.reward?.trim());
  if (!rewards.length) return null;

  return (
    <View className="bg-warmGold/10 border border-warmGold/30 rounded-2xl p-5 mb-5">
      <View
        className="flex-row items-center gap-2 mb-3"
        style={{ direction: "rtl" }}
      >
        <ArabicText
          accessibilityRole="header"
          className="flex-1 font-tajawal-bold text-warmBrown text-base"
        >
          الفضل والثواب
        </ArabicText>
      </View>
      {(expanded ? rewards : rewards.slice(0, 1)).map((member, index) => (
        <View
          key={member.id}
          className={index ? "mt-4 pt-4 border-t border-warmGold/25" : ""}
        >
          <ArabicText className="font-tajawal-bold text-warmBrownLight text-sm leading-6 mb-1">
            {member.title}
          </ArabicText>
          <ArabicText
            className="font-amiri text-warmBrown text-xl leading-9"
            style={{ writingDirection: "rtl" }}
          >
            {member.reward}
          </ArabicText>
        </View>
      ))}
      {rewards.length > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          className="flex-row items-center justify-center gap-2 min-h-11 mt-3 pt-2 border-t border-warmGold/25"
          style={{ direction: "rtl" }}
        >
          <ArabicText
            align="center"
            className="font-tajawal-bold text-warmBrownLight text-sm"
          >
            {expanded ? "إخفاء بقية الفضائل" : "عرض بقية الفضائل"}
          </ArabicText>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={palette.warmBrownLight}
          />
        </Pressable>
      )}
    </View>
  );
}
