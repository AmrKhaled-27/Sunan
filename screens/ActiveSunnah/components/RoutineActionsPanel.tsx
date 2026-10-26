import { ArabicText } from "@/components/ui/ArabicText";
import { Sunnah } from "@/types";
import React from "react";
import { View } from "react-native";

export const RoutineActionsPanel = React.forwardRef<
  View,
  { members: Sunnah[] }
>(function RoutineActionsPanel({ members }, ref) {
  return (
    <View ref={ref} collapsable={false} className="w-full">
      <View className="items-center justify-center mb-4 pt-1">
        <ArabicText
          align="center"
          accessibilityRole="header"
          className="font-amiri-bold text-warmBrown text-2xl"
        >
          سنن نُحييها اليوم
        </ArabicText>
        <ArabicText
          align="center"
          className="font-tajawal text-warmBrownMuted text-xs leading-5 mt-1"
        >
          الأرقام للتوضيح، وليست ترتيباً شرعياً ملزماً
        </ArabicText>
      </View>
      {members.map((member, index) => (
        <View
          key={member.id}
          className={
            index > 0 ? "border-t border-warmGold/20 pt-5 mt-5" : "pt-2"
          }
        >
          <View
            className="flex-row items-center gap-3 mb-2.5"
            style={{ direction: "rtl" }}
          >
            <View className="w-8 h-8 rounded-full border border-warmGold/40 bg-warmGold/15 items-center justify-center">
              <ArabicText
                align="center"
                className="font-amiri-bold text-warmBrown text-base"
              >
                {(index + 1).toLocaleString("ar-EG")}
              </ArabicText>
            </View>
            <ArabicText
              accessibilityRole="header"
              className="flex-1 font-tajawal-bold text-warmBrown text-lg leading-7"
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
              className="mt-3 bg-warmGold/10 rounded-xl px-3.5 py-2.5 flex-row items-start gap-2 border border-warmGold/25"
              style={{ direction: "rtl" }}
            >
              <ArabicText className="font-amiri text-warmGold text-base leading-6">
                ✦
              </ArabicText>
              <ArabicText
                selectable
                className="flex-1 font-amiri text-warmBrown text-[15px] leading-6"
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
