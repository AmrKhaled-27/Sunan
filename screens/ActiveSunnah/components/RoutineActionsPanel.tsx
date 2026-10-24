import { ArabicText } from "@/components/ui/ArabicText";
import { Card } from "@/components/ui/Card";
import { Sunnah } from "@/types";
import React from "react";
import { View } from "react-native";

export const RoutineActionsPanel = React.forwardRef<
  View,
  { members: Sunnah[] }
>(function RoutineActionsPanel({ members }, ref) {
  return (
    <Card ref={ref} className="mb-0" color="#FFFCF5">
      <ArabicText
        align="center"
        accessibilityRole="header"
        className="font-amiri-bold text-warmBrown text-2xl mb-1"
      >
        سنن نُحييها اليوم
      </ArabicText>
      <ArabicText
        align="center"
        className="font-tajawal text-warmBrownMuted text-sm leading-6 mb-3"
      >
        الأرقام للتوضيح، وليست ترتيباً شرعياً ملزماً
      </ArabicText>
      {members.map((member, index) => (
        <View
          key={member.id}
          className={
            index > 0 ? "border-t border-warmGold/20 pt-6 mt-6" : "pt-4"
          }
        >
          <View
            className="flex-row items-start gap-3 mb-3"
            style={{ direction: "rtl" }}
          >
            <View className="min-w-9 min-h-9 px-2 py-1 rounded-xl border border-warmGold/40 bg-warmGold/15 items-center justify-center">
              <ArabicText
                align="center"
                className="font-amiri-bold text-warmBrownLight text-lg"
              >
                {(index + 1).toLocaleString("ar-EG")}
              </ArabicText>
            </View>
            <ArabicText
              accessibilityRole="header"
              className="flex-1 font-tajawal-bold text-warmBrown text-xl leading-8"
            >
              {member.title}
            </ArabicText>
          </View>
          <ArabicText
            selectable
            className="font-tajawal text-warmBrownLight text-lg leading-9"
            style={{ writingDirection: "rtl" }}
          >
            {member.action}
          </ArabicText>
        </View>
      ))}
    </Card>
  );
});
