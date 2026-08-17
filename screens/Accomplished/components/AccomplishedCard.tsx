import React from "react";
import { Image, Text, View } from "react-native";
import { Sunnah } from "@/types";

export function AccomplishedCard({ item }: { item: Sunnah }) {
  return (
    <View className="w-full mb-5 rounded-2xl shadow-sm shadow-warmBrown/10 overflow-hidden bg-parchmentLight border border-warmGold/20">
      {/* Decorative Images */}
      <Image
        source={require("@/assets/images/top-right-decorations.png")}
        className="absolute top-[-5] left-0 w-[100px] h-[100px] opacity-70"
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/bottome-left-decorations.png")}
        className="absolute bottom-[-10] right-0 w-[100px] h-[100px] opacity-70"
        resizeMode="contain"
      />

      <View className="p-6">
        <Text
          className="font-tajawal-bold text-[18px] text-warmBrown leading-7 text-center mb-2"
          style={{ writingDirection: "rtl" }}
        >
          {item.title}
        </Text>

        {item.action && (
          <Text
            className="font-tajawal text-[15px] text-warmBrownLight leading-7 text-center"
            style={{ writingDirection: "rtl" }}
          >
            {item.action}
          </Text>
        )}
      </View>
    </View>
  );
}
