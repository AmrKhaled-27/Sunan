import React from "react";
import { Text, View } from "react-native";

export function StatsRow({
  totalCompleted,
  longestStreak,
}: {
  totalCompleted: number;
  longestStreak: number;
}) {
  return (
    <View className="flex-row gap-3 mx-5 mb-4">
      <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-3 items-center">
        <Text className="font-tajawal-bold text-warmGold text-2xl">
          {totalCompleted}
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-sm text-center">
          سنن مكتملة
        </Text>
      </View>
      <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-3 items-center">
        <Text className="font-tajawal-bold text-warmGold text-2xl">
          {longestStreak}
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-sm text-center">
          أطول سلسلة
        </Text>
      </View>
    </View>
  );
}
