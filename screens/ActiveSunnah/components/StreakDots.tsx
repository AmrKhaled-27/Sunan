import React from "react";
import { Text, View } from "react-native";

export function StreakDots({
  count,
  total = 7,
}: {
  count: number;
  total?: number;
}) {
  return (
    <View className="flex-row justify-center items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={[
            "w-7 h-7 rounded-full items-center justify-center",
            i < count
              ? "bg-warmGold"
              : "bg-warmGold/15 border border-warmGold/30",
          ].join(" ")}
        >
          {i < count && (
            <Text className="text-white text-[10px] font-bold">✓</Text>
          )}
        </View>
      ))}
    </View>
  );
}
