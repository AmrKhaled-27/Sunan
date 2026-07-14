import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PaperBackground } from "@/components/PaperBackground";
import { useSunnah } from "@/hooks/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Streak dots ──────────────────────────────────────────────────────────────

function StreakDots({ count, total = 7 }: { count: number; total?: number }) {
  return (
    <View className="flex-row justify-center items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={[
            "w-7 h-7 rounded-full items-center justify-center",
            i < count
              ? "bg-warmGold"
              : "bg-warmGold/15 border border-warmGold/30",
          ].join(" ")}
        >
          {i < count && (
            <Text className="text-white text-[10px] font-bold">✓</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Milestone Banner ─────────────────────────────────────────────────────────

function MilestoneBanner({ count }: { count: number }) {
  const milestones: Record<number, string> = {
    3: "رائع! لقد تجاوزت النصف 🌟",
    6: "يوم واحد بقي! تحلَّ بالصبر 💪",
  };
  const msg = milestones[count];
  if (!msg) return null;
  return (
    <View className="mx-0 mb-4 px-4 py-3 rounded-xl bg-warmGold/10 border border-warmGold/30">
      <Text className="font-tajawal-bold text-warmGold text-center text-base">
        {msg}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ActiveSunnahScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentSunnah,
    streakCount,
    hasMarkedToday,
    streakBrokenToday,
    markDoneToday,
    markAlreadyDoing,
    skipSunnah,
    isLoading,
  } = useSunnah();

  const [showAlreadyConfirm, setShowAlreadyConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  if (isLoading) {
    return (
      <PaperBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#C4A46C" />
        </View>
      </PaperBackground>
    );
  }

  if (!currentSunnah) {
    return (
      <PaperBackground>
        <View
          className="flex-1 justify-center items-center p-6"
          style={{ paddingTop: insets.top }}
        >
          <Text className="text-5xl mb-4">🌙</Text>
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-2">
            أتممت جميع السنن!
          </Text>
          <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8">
            جزاك الله خيراً، انتظر إضافة سنن جديدة
          </Text>
        </View>
      </PaperBackground>
    );
  }

  const categoryLabels: Record<string, string> = {
    prayer: "🕌 صلاة",
    eating: "🍽️ طعام",
    sleeping: "🌙 نوم",
    dhikr: "📿 ذكر",
    social: "🤝 معاملات",
    hygiene: "✨ نظافة",
    general: "⭐ عام",
  };

  const difficultyLabels: Record<string, string> = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
  };

  const difficultyColors: Record<string, string> = {
    easy: "#6BA587",
    medium: "#C4A46C",
    hard: "#C47A5C",
  };

  return (
    <PaperBackground>
      {/* Broken streak banner */}
      {streakBrokenToday && (
        <View
          className="mx-5 mt-2 px-4 py-3 rounded-xl bg-red-100 border border-red-300"
          style={{ marginTop: insets.top + 8 }}
        >
          <Text className="font-tajawal-bold text-red-700 text-center text-base">
            انقطعت سلسلتك بسبب يوم فائت. ابدأ من جديد! 💪
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-[100px]"
        contentContainerStyle={{
          paddingTop: streakBrokenToday ? 12 : insets.top + 12,
        }}
      >
        {/* Title */}
        <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-2">
          سنة اليوم
        </Text>

        {/* Category badge */}
        <View className="flex-row justify-center items-center mb-5">
          <View className="px-3 py-1 rounded-full bg-warmGold/10 border border-warmGold/20">
            <Text className="font-tajawal text-warmGold text-sm">
              {categoryLabels[currentSunnah.category] ?? currentSunnah.category}
            </Text>
          </View>
        </View>

        {/* Milestone banner */}
        <MilestoneBanner count={streakCount} />

        {/* Streak dots */}
        <StreakDots count={streakCount} />

        {/* Sunnah Card */}
        <Card variant="home" className="mb-4">
          <Text className="font-amiri-bold text-[28px] text-warmBrown text-center mb-4 leading-[44px]">
            {currentSunnah.title}
          </Text>

          {/* Explanation (Action) */}
          {currentSunnah.action && (
            <Text className="font-tajawal-bold text-lg text-warmBrownLight text-center leading-8 mb-5">
              {currentSunnah.action}
            </Text>
          )}

          <View className="flex-row items-center justify-center mb-4">
            <View className="flex-1 h-[0.5px] bg-warmGold/30" />
            <View className="mx-3">
              <Ionicons name="moon-outline" size={16} color="#C4A46C" />
            </View>
            <View className="flex-1 h-[0.5px] bg-warmGold/30" />
          </View>

          {/* Hadith */}
          <Text className="font-amiri text-lg text-warmBrownLight/80 text-center leading-[32px]">
            {currentSunnah.hadith}
          </Text>

          {/* Reward */}
          {currentSunnah.reward && (
            <View className="mt-6 bg-warmGold/10 px-4 py-3 rounded-xl border border-warmGold/20">
              <View className="flex-row items-center justify-center mb-2 gap-1">
                <Ionicons name="gift-outline" size={18} color="#C4A46C" />
                <Text className="font-tajawal-bold text-warmGold text-sm">
                  الثواب والأجر
                </Text>
              </View>
              <Text className="font-tajawal-bold text-base text-warmBrown text-center leading-7">
                {currentSunnah.reward}
              </Text>
              {currentSunnah.rewardSource && (
                <Text className="font-tajawal text-xs text-warmBrownLight text-center mt-2 opacity-80 leading-5">
                  {currentSunnah.rewardSource}
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Notification times */}
        <View className="px-2 mb-4">
          <Text className="font-tajawal text-warmBrownLight text-sm text-center opacity-70">
            تصلك تذكيرات هذه السنة في:{"  "}
            {currentSunnah.notificationSchedule.reminderSlots
              .map((s) => {
                const labels: Record<string, string> = {
                  fajr: "الفجر",
                  morning: "الصباح",
                  dhuhr: "الظهر",
                  asr: "العصر",
                  afternoon: "بعد الظهر",
                  maghrib: "المغرب",
                  ishaa: "العشاء",
                  evening: "المساء",
                  before_sleep: "قبل النوم",
                };
                return labels[s];
              })
              .join(" · ")}
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-2">
          <Button
            title={hasMarkedToday ? "تم إنجازها اليوم" : "فعلتها اليوم"}
            onPress={hasMarkedToday ? () => {} : markDoneToday}
            color="#90937A"
            colorEnd="#787C62"
            textColor="#FFFFFF"
            disabled={hasMarkedToday}
          />

          <Button
            title="أفعلها بالفعل في حياتي"
            onPress={() => setShowAlreadyConfirm(true)}
            color="#A89A84"
            colorEnd="#8A7E6B"
            textColor="#FFFFFF"
          />

          <Button
            title="تخطي هذه السنة"
            onPress={() => setShowSkipConfirm(true)}
            variant="ghost"
            color="#A89A84"
          />
        </View>
      </ScrollView>

      {/* Already Doing Confirm Modal */}
      <Modal transparent animationType="fade" visible={showAlreadyConfirm}>
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-[#FAF7F0] rounded-2xl p-6 w-full">
            <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-3">
              هل أنت متأكد؟
            </Text>
            <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8 mb-6">
              هذا يعني أنك تفعل «{currentSunnah.title}» بانتظام في حياتك،
              وستنتقل مباشرةً للسنة التالية.
            </Text>
            <Button
              title="نعم، أفعلها باستمرار"
              onPress={() => {
                setShowAlreadyConfirm(false);
                markAlreadyDoing();
              }}
              color="#90937A"
              colorEnd="#787C62"
              textColor="#FFFFFF"
            />
            <Button
              title="رجوع"
              onPress={() => setShowAlreadyConfirm(false)}
              variant="ghost"
              color="#A89A84"
            />
          </View>
        </View>
      </Modal>

      {/* Skip Confirm Modal */}
      <Modal transparent animationType="fade" visible={showSkipConfirm}>
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-[#FAF7F0] rounded-2xl p-6 w-full">
            <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-3">
              تخطي هذه السنة؟
            </Text>
            <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8 mb-6">
              ستنتقل للسنة التالية. يمكنك العودة إليها لاحقاً من قائمة السنن.
            </Text>
            <Button
              title="نعم، تخطي"
              onPress={() => {
                setShowSkipConfirm(false);
                skipSunnah();
              }}
              color="#A89A84"
              colorEnd="#8A7E6B"
              textColor="#FFFFFF"
            />
            <Button
              title="رجوع"
              onPress={() => setShowSkipConfirm(false)}
              variant="ghost"
              color="#A89A84"
            />
          </View>
        </View>
      </Modal>
    </PaperBackground>
  );
}
