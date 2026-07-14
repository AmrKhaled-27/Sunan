import { PaperBackground } from "@/components/PaperBackground";
import { Sunnah } from "@/constants/data";
import { useSunnah } from "@/hooks/SunnahContext";
import React from "react";
import { FlatList, Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatsRow({
  totalCompleted,
  longestStreak,
}: {
  totalCompleted: number;
  longestStreak: number;
}) {
  return (
    <View className="flex-row gap-3 mx-5 mb-4">
      <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-3 items-center">
        <Text className="font-tajawal-bold text-warmGold text-2xl">
          {totalCompleted}
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-sm text-center">
          سنن مكتملة
        </Text>
      </View>
      <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-3 items-center">
        <Text className="font-tajawal-bold text-warmGold text-2xl">
          {longestStreak}
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-sm text-center">
          أطول سلسلة
        </Text>
      </View>
    </View>
  );
}

// ─── Sunnah card in list ──────────────────────────────────────────────────────

function AccomplishedCard({ item }: { item: Sunnah }) {
  return (
    <View className="w-full mb-5 rounded-2xl shadow-sm shadow-[#3D2E1F]/10 overflow-hidden bg-[#FAF7F0] border border-warmGold/20">
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AccomplishedScreen() {
  const insets = useSafeAreaInsets();
  const { accomplishedSunnahs, totalCompleted, longestStreak } = useSunnah();

  return (
    <PaperBackground>
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
        <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-4 px-5">
          الانجازات
        </Text>

        {accomplishedSunnahs.length > 0 && (
          <StatsRow
            totalCompleted={totalCompleted}
            longestStreak={longestStreak}
          />
        )}

        {accomplishedSunnahs.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-5xl opacity-20 mb-4">☾</Text>
            <Text className="font-tajawal-bold text-[22px] text-warmBrown text-center">
              لم تنجز أي سنن بعد.
            </Text>
            <Text className="font-tajawal text-[17px] text-warmBrownLight text-center mt-3 leading-7">
              ابدأ بتطبيق السنن اليومية لتراها هنا.
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...accomplishedSunnahs].reverse()}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-[90px] pt-2"
            renderItem={({ item }) => <AccomplishedCard item={item} />}
          />
        )}
      </View>
    </PaperBackground>
  );
}
