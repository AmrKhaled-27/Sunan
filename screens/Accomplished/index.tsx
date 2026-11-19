import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import { AccomplishedRecord, Sunnah } from "@/types";
import { buildAchievementCollections } from "@/utils/achievements";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CollectionCard } from "./components/CollectionCard";
import { StatsRow } from "./components/StatsRow";
import { SunnahDetailModal } from "./components/SunnahDetailModal";

interface Selection {
  sunnah: Sunnah;
  record?: AccomplishedRecord;
  context: string;
}

export default function AccomplishedScreen() {
  const insets = useSafeAreaInsets();
  const {
    accomplishedSunnahs,
    accomplishedRecords,
    totalCompleted,
    longestStreak,
  } = useSunnah();

  const collections = useMemo(
    () => buildAchievementCollections(accomplishedSunnahs, accomplishedRecords),
    [accomplishedSunnahs, accomplishedRecords],
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

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
                <Ionicons
                  name="moon-outline"
                  size={26}
                  color={palette.warmGold}
                />
              </View>
              <Text className="font-tajawal-bold text-[22px] text-warmBrown text-center">
                لم تنجز أي سنن بعد
              </Text>
              <Text className="font-tajawal text-[16px] text-warmBrownLight text-center mt-3 leading-7">
                أتمّ روتيناً لسبعة أيام متتالية، وستظهر سننه هنا ضمن إنجازاتك.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={collections}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-8 pt-2"
            renderItem={({ item }) => (
              <CollectionCard
                collection={item}
                onSelect={({ sunnah, record }, context) => {
                  setSelection({ sunnah, record, context });
                  setDetailVisible(true);
                }}
              />
            )}
          />
        )}
      </View>

      <SunnahDetailModal
        visible={detailVisible}
        sunnah={selection?.sunnah ?? null}
        record={selection?.record}
        context={selection?.context}
        onClose={() => setDetailVisible(false)}
      />
    </PaperBackground>
  );
}
