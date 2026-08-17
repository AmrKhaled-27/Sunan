import React from "react";
import { Text, View } from "react-native";

export function SettingRow({
  label,
  description,
  right,
}: {
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-warmGold/10">
      <View className="flex-1 ml-4">
        <Text className="font-tajawal-bold text-warmBrown text-lg">
          {label}
        </Text>
        {description && (
          <Text className="font-tajawal text-warmBrownLight text-sm mt-0.5 leading-5">
            {description}
          </Text>
        )}
      </View>
      <View className="mr-1">{right}</View>
    </View>
  );
}
