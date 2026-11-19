import { ArabicText } from "@/components/ui/ArabicText";
import { HadithEvidence, HadithGrading } from "@/types";
import React from "react";
import { View } from "react-native";

export const gradingLabels: Record<HadithGrading, string> = {
  sahih: "صحيح",
  hasan: "حسن",
  daif: "ضعيف",
};

export function HadithEvidenceCard({ hadith }: { hadith: HadithEvidence }) {
  return (
    <View className="bg-parchmentPure rounded-2xl border border-warmGold/20 p-4 mb-3">
      <ArabicText
        selectable
        className="font-amiri text-warmBrown text-xl leading-10"
        style={{ writingDirection: "rtl" }}
      >
        {hadith.text}
      </ArabicText>
      <View className="border-t border-warmGold/20 pt-3 mt-4">
        <ArabicText
          selectable
          className="font-tajawal text-warmBrownLight text-sm leading-6"
        >
          {hadith.source}
        </ArabicText>
        <ArabicText className="font-tajawal-bold text-warmBrownLight text-sm leading-6 mt-1">
          درجة الحديث: {gradingLabels[hadith.grading]}
        </ArabicText>
      </View>
    </View>
  );
}
