import React from "react";
import { Text, View } from "react-native";

export const StreakDots = React.forwardRef<
  View,
  { count: number; total?: number }
>(function StreakDots({ count, total = 7 }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      className="flex-row justify-center items-center mb-8"
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < count;
        const current = i === count;
        return (
          <View key={i} className="flex-row items-center">
            <View
              className={[
                "items-center justify-center rounded-full",
                filled
                  ? "w-8 h-8 bg-warmGold"
                  : current
                    ? "w-9 h-9 bg-warmGold/15 border-2 border-warmGold"
                    : "w-8 h-8 bg-warmGold/15 border border-warmGold/30",
              ].join(" ")}
            >
              <Text
                className={[
                  "font-tajawal-bold text-[11px]",
                  filled
                    ? "text-white"
                    : current
                      ? "text-warmGold"
                      : "text-warmGold/50",
                ].join(" ")}
              >
                {filled ? "✓" : i + 1}
              </Text>
            </View>
            {i < total - 1 && (
              <View
                className={`w-2.5 h-[2px] mx-0.5 rounded-full ${
                  i < count - 1 ? "bg-warmGold" : "bg-warmGold/25"
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
});
