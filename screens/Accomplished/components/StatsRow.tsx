import { palette } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 bg-parchmentLight border border-warmGold/20 rounded-2xl px-4 py-3.5 items-center">
      <View className="w-8 h-8 rounded-full bg-warmGold/15 items-center justify-center mb-1.5">
        <Ionicons name={icon} size={16} color={palette.warmGold} />
      </View>
      <Text className="font-tajawal-bold text-warmGold text-2xl">{value}</Text>
      <Text className="font-tajawal text-warmBrownLight text-sm text-center mt-0.5">
        {label}
      </Text>
    </View>
  );
}

export function StatsRow({
  totalCompleted,
  longestStreak,
}: {
  totalCompleted: number;
  longestStreak: number;
}) {
  return (
    <View className="flex-row gap-3 mx-5 mb-4">
      <StatCard
        value={totalCompleted}
        label="سنن مكتملة"
        icon="checkmark"
      />
      <StatCard
        value={longestStreak}
        label="أطول سلسلة"
        icon="flame-outline"
      />
    </View>
  );
}
