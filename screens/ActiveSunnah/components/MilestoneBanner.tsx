import React from "react";
import { Text, View } from "react-native";

export function MilestoneBanner({ count }: { count: number }) {
  const milestones: Record<number, string> = {
    3: "رائع! لقد تجاوزت النصف",
    6: "يوم واحد بقي! تحلَّ بالصبر",
  };
  const msg = milestones[count];
  if (!msg) return null;
  return (
    <View className="mx-0 mb-4 px-4 py-3 rounded-xl bg-warmGold/10 border border-warmGold/30">
      <Text className="font-tajawal-bold text-warmGold text-center text-base">
        {msg}
      </Text>
    </View>
  );
}
