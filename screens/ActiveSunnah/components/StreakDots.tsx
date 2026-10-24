import { ArabicText } from "@/components/ui/ArabicText";
import React from "react";
import { View } from "react-native";

export const StreakDots = React.forwardRef<
  View,
  { count: number; total?: number }
>(function StreakDots({ count, total = 7 }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      accessible
      accessibilityLabel={`أتممت ${count} من ${total} أيام متتالية`}
      className="flex-row items-center justify-center self-center w-full"
      style={{ direction: "rtl", maxWidth: 310 }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <View
              className={`h-[2px] rounded-full ${index < count ? "bg-warmGold" : "bg-warmGold/25"}`}
              style={{ width: 4, marginHorizontal: 1 }}
            />
          )}
          <View
            className={`rounded-full items-center justify-center ${index < count ? "bg-warmGold" : index === count ? "bg-warmGold/15 border-2 border-warmGold" : "bg-warmGold/10 border border-warmGold/30"}`}
            style={{ flex: 1, aspectRatio: 1, maxWidth: 36 }}
          >
            <ArabicText
              align="center"
              maxFontSizeMultiplier={1.3}
              className={`font-tajawal-bold text-xs ${index < count ? "text-white" : index === count ? "text-warmBrown" : "text-warmBrownMuted"}`}
            >
              {index < count ? "✓" : (index + 1).toLocaleString("ar-EG")}
            </ArabicText>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
});
