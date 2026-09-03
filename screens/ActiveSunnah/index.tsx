import { useTourTarget } from "@/components/onboarding/TourTarget";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlreadyDoingModal } from "./components/AlreadyDoingModal";
import { MilestoneBanner } from "./components/MilestoneBanner";
import { SkipModal } from "./components/SkipModal";
import { StreakBrokenToast } from "./components/StreakBrokenToast";
import { StreakCompleteModal } from "./components/StreakCompleteModal";
import { StreakDots } from "./components/StreakDots";

const HADITH_CHAR_LIMIT = 120;

function getTruncatedHadith(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const sliced = text.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced) + "...";
}

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

  const { registerScroller, setHomeReady } = useOnboarding();
  const cardRef = useTourTarget("card");
  const streakDotsRef = useTourTarget("streakDots");
  const markDoneRef = useTourTarget("markDone");
  const alreadyDoingRef = useTourTarget("alreadyDoing");
  const skipRef = useTourTarget("skip");

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);

  const [showAlreadyConfirm, setShowAlreadyConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState("");
  const [hadithExpanded, setHadithExpanded] = useState(false);

  // Reset hadith expand state when sunnah changes
  useEffect(() => {
    setHadithExpanded(false);
  }, [currentSunnah?.id]);

  // Record the commanded offset up front: onScroll lags behind an animated
  // scroll, and the tour computes its next scroll from this value.
  const scrollTourTo = useCallback((y: number) => {
    scrollOffsetRef.current = y;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  // Let the tour scroll targets into view before measuring them.
  useEffect(() => {
    registerScroller({
      scrollTo: scrollTourTo,
      getOffset: () => scrollOffsetRef.current,
    });
    return () => registerScroller(null);
  }, [registerScroller, scrollTourTo]);

  // The tour only makes sense once the real card and controls are on screen.
  useEffect(() => {
    setHomeReady(!isLoading && !!currentSunnah);
    return () => setHomeReady(false);
  }, [isLoading, currentSunnah, setHomeReady]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  };

  const handleMarkDone = () => {
    if (hasMarkedToday) return;
    const completingStreak = streakCount === 6;
    const completedTitle = currentSunnah?.title;

    try {
      if (Platform.OS === "ios") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Vibration.vibrate(80);
      }
    } catch {
      Vibration.vibrate(80);
    }

    markDoneToday();
    if (completingStreak && completedTitle) {
      setCelebrationTitle(completedTitle);
      setShowCelebration(true);
    }
  };

  if (isLoading) {
    return (
      <PaperBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={palette.warmGold} />
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
          <Image
            source={require("@/assets/images/app-icon.png")}
            className="w-24 h-24 rounded-2xl mb-6 opacity-80"
            resizeMode="contain"
          />
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-2">
            أتممت جميع السنن!
          </Text>
          <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8">
            جزاك الله خيراً، انتظر إضافة سنن جديدة
          </Text>
        </View>

        <StreakCompleteModal
          visible={showCelebration}
          sunnahTitle={celebrationTitle}
          onClose={() => setShowCelebration(false)}
        />
      </PaperBackground>
    );
  }

  const isLongHadith = (currentSunnah.hadith?.length ?? 0) > HADITH_CHAR_LIMIT;

  return (
    <PaperBackground>
      {/* Animated auto-dismissing broken streak toast */}
      <StreakBrokenToast visible={streakBrokenToday} />

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // Android clips off-screen children by default, which detaches them
        // from the native view hierarchy. The tour has to measure targets
        // while they are still out of view in order to scroll to them.
        removeClippedSubviews={false}
        className="flex-1"
        contentContainerClassName="p-5 pb-[100px]"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
        }}
      >
        {/* Title */}
        <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-5">
          سنة اليوم
        </Text>

        {/* Milestone banner */}
        <MilestoneBanner count={streakCount} />

        {/* Streak dots */}
        <StreakDots ref={streakDotsRef} count={streakCount} />

        {/* Sunnah Card */}
        <Card ref={cardRef} variant="home" className="mb-4">
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
              <Ionicons
                name="moon-outline"
                size={16}
                color={palette.warmGold}
              />
            </View>
            <View className="flex-1 h-[0.5px] bg-warmGold/30" />
          </View>

          {/* Hadith */}
          <Text
            className="font-amiri text-lg text-warmBrownLight/80 text-center leading-[32px]"
            onPress={() => {
              if (isLongHadith) setHadithExpanded((prev) => !prev);
            }}
          >
            {isLongHadith && !hadithExpanded
              ? getTruncatedHadith(currentSunnah.hadith, HADITH_CHAR_LIMIT)
              : currentSunnah.hadith}
          </Text>

          {isLongHadith && (
            <TouchableOpacity
              onPress={() => setHadithExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={
                hadithExpanded ? "عرض أقل للحديث" : "اقرأ المزيد من الحديث"
              }
              activeOpacity={0.7}
              className="mt-2 py-1 self-center flex-row items-center justify-center gap-1.5"
            >
              <Text className="font-tajawal-bold text-sm text-warmGold">
                {hadithExpanded ? "عرض أقل" : "اقرأ المزيد..."}
              </Text>
              <Ionicons
                name={hadithExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={palette.warmGold}
              />
            </TouchableOpacity>
          )}

          {/* Reward */}
          {currentSunnah.reward && (
            <View className="mt-6 bg-warmGold/10 px-4 py-3 rounded-xl border border-warmGold/20">
              <View className="flex-row items-center justify-center mb-2 gap-1">
                <Ionicons
                  name="gift-outline"
                  size={18}
                  color={palette.warmGold}
                />
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

        {/* Primary Action */}
        <View ref={markDoneRef} collapsable={false} className="mt-2">
          <Button
            title={hasMarkedToday ? "تم إنجازها اليوم" : "فعلتها اليوم"}
            onPress={handleMarkDone}
            color={palette.oliveGreen}
            colorEnd={palette.oliveGreenDark}
            textColor={palette.white}
            disabled={hasMarkedToday}
          />
        </View>

        {/* Secondary Actions */}
        <View className="flex-row gap-3 mt-1 mb-2">
          <TouchableOpacity
            ref={alreadyDoingRef}
            onPress={() => setShowAlreadyConfirm(true)}
            accessibilityRole="button"
            accessibilityLabel="أفعلها بالفعل"
            accessibilityHint="تحديد أنك ملتزم بهذه السنة مسبقاً والانتقال للسنة التالية"
            activeOpacity={0.8}
            className="flex-1 py-3.5 rounded-2xl bg-warmGold/15 border border-warmGold/30 items-center"
          >
            <Text className="font-tajawal-bold text-warmBrownLight text-sm">
              أفعلها بالفعل
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            ref={skipRef}
            onPress={() => setShowSkipConfirm(true)}
            accessibilityRole="button"
            accessibilityLabel="تخطي هذه السنة"
            accessibilityHint="تخطي هذه السنة مؤقتاً والانتقال للسنة التالية"
            activeOpacity={0.8}
            className="flex-1 py-3.5 rounded-2xl bg-warmGold/15 border border-warmGold/30 items-center"
          >
            <Text className="font-tajawal-bold text-warmBrownLight text-sm">
              تخطي
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Already Doing Confirm Modal */}
      <AlreadyDoingModal
        visible={showAlreadyConfirm}
        sunnahTitle={currentSunnah.title}
        onConfirm={() => {
          setShowAlreadyConfirm(false);
          markAlreadyDoing();
        }}
        onClose={() => setShowAlreadyConfirm(false)}
      />

      {/* Skip Confirm Modal */}
      <SkipModal
        visible={showSkipConfirm}
        onConfirm={() => {
          setShowSkipConfirm(false);
          skipSunnah();
        }}
        onClose={() => setShowSkipConfirm(false)}
      />

      <StreakCompleteModal
        visible={showCelebration}
        sunnahTitle={celebrationTitle}
        onClose={() => setShowCelebration(false)}
      />
    </PaperBackground>
  );
}
