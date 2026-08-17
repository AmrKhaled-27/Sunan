import { PaperBackground } from "@/components/ui/PaperBackground";
import { useSunnah } from "@/context/SunnahContext";
import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccomplishedCard } from "./components/AccomplishedCard";
import { StatsRow } from "./components/StatsRow";

export default function AccomplishedScreen() {
  const insets = useSafeAreaInsets();
  const { accomplishedSunnahs, totalCompleted, longestStreak } = useSunnah();

  const reversedAccomplished = useMemo(
    () => [...accomplishedSunnahs].reverse(),
    [accomplishedSunnahs]
  );

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
            data={reversedAccomplished}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-[90px] pt-2"
            renderItem={({ item }) => <AccomplishedCard item={item} />}
          />
        )}
      </View>
    </PaperBackground>
  );
}
