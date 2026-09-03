import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccomplishedCard } from "./components/AccomplishedCard";
import { StatsRow } from "./components/StatsRow";

export default function AccomplishedScreen() {
  const insets = useSafeAreaInsets();
  const { accomplishedSunnahs, accomplishedRecords, totalCompleted, longestStreak } =
    useSunnah();

  const recordsById = useMemo(() => {
    const map = new Map(
      accomplishedRecords.map((record) => [record.id, record]),
    );
    return map;
  }, [accomplishedRecords]);

  const newestFirst = useMemo(
    () => [...accomplishedSunnahs].reverse(),
    [accomplishedSunnahs],
  );

  return (
    <PaperBackground>
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
        <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-4 px-5">
          الانجازات
        </Text>

        <StatsRow
          totalCompleted={totalCompleted}
          longestStreak={longestStreak}
        />

        {accomplishedSunnahs.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8 pb-16">
            <View className="w-full rounded-2xl overflow-hidden bg-parchmentLight border border-warmGold/20 px-6 py-10 items-center">
              <Image
                source={require("@/assets/images/top-right-decorations.png")}
                className="absolute top-[-8] left-0 w-[110px] h-[110px] opacity-50"
                resizeMode="contain"
              />
              <Image
                source={require("@/assets/images/bottome-left-decorations.png")}
                className="absolute bottom-[-12] right-0 w-[110px] h-[110px] opacity-50"
                resizeMode="contain"
              />
              <View className="w-14 h-14 rounded-full bg-warmGold/15 items-center justify-center mb-4">
                <Ionicons name="moon-outline" size={26} color={palette.warmGold} />
              </View>
              <Text className="font-tajawal-bold text-[22px] text-warmBrown text-center">
                لم تنجز أي سنن بعد
              </Text>
              <Text className="font-tajawal text-[16px] text-warmBrownLight text-center mt-3 leading-7">
                أتمّ سنة لسبعة أيام متتالية، وستظهر هنا كعادة ثبتّها.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={newestFirst}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-[110px] pt-2"
            renderItem={({ item }) => (
              <AccomplishedCard item={item} record={recordsById.get(item.id)} />
            )}
          />
        )}
      </View>
    </PaperBackground>
  );
}
