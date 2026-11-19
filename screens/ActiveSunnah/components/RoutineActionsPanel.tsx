import { ArabicText } from "@/components/ui/ArabicText";
import { Sunnah } from "@/types";
import React from "react";
import { View } from "react-native";

export const RoutineActionsPanel = React.forwardRef<
  View,
  { members: Sunnah[] }
>(function RoutineActionsPanel({ members }, ref) {
  return (
    <View className="w-full">
      {members.map((member, index) => (
        <View
          key={member.id}
          ref={index === 0 ? ref : undefined}
          collapsable={index === 0 ? false : undefined}
        >
          {index > 0 && (
            <View className="mx-8 my-5 h-[1px] bg-warmGold/20" />
          )}
          <View
            className="flex-row items-center gap-2.5 mb-2"
            style={{ direction: "rtl" }}
          >
            {members.length > 1 && (
              <View className="w-7 h-7 rounded-full border border-warmGold/35 bg-warmGold/12 items-center justify-center">
                <ArabicText
                  align="center"
                  className="font-amiri-bold text-warmBrown text-sm"
                >
                  {(index + 1).toLocaleString("ar-EG")}
                </ArabicText>
              </View>
            )}
            <ArabicText
              accessibilityRole="header"
              className="flex-1 font-tajawal-bold text-warmBrown text-[18px] leading-7"
            >
              {member.title}
            </ArabicText>
          </View>
          <ArabicText
            selectable
            className="font-tajawal text-warmBrownLight text-[16px] leading-8"
            style={{ writingDirection: "rtl" }}
          >
            {member.action}
          </ArabicText>
          {member.reward?.trim() ? (
            <View
              className="mt-3 pr-3.5 pl-3 py-2 bg-warmGold/10 rounded-l-xl border-r-[2.5px] border-r-warmGold/60 flex-row items-start gap-2"
              style={{ direction: "rtl" }}
            >
              <ArabicText className="font-amiri text-warmGold text-sm leading-6">
                ✦
              </ArabicText>
              <ArabicText
                selectable
                className="flex-1 font-amiri text-warmBrown text-[15px] leading-7"
                style={{ writingDirection: "rtl" }}
              >
                الفضل: «{member.reward.trim()}»
              </ArabicText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
});
