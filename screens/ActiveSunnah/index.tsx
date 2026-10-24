import { useTourTarget } from "@/components/onboarding/TourTarget";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSunnah } from "@/context/SunnahContext";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlreadyDoingModal } from "./components/AlreadyDoingModal";
import { SkipModal } from "./components/SkipModal";
import { StreakBrokenToast } from "./components/StreakBrokenToast";
import { StreakCompleteModal } from "./components/StreakCompleteModal";
import { StreakDots } from "./components/StreakDots";

// Plan 1 bridge: expose every credited action; final Today design is Plan 2.
export default function ActiveSunnahScreen() {
  const insets = useSafeAreaInsets();
  const { currentRoutine, remainingMembers, streakCount, hasMarkedToday, streakBrokenToday,
    markDoneToday, markAlreadyDoing, postponeRoutine, isLoading } = useSunnah();
  const { registerScroller, setHomeReady } = useOnboarding();
  const cardRef = useTourTarget("card");
  const streakDotsRef = useTourTarget("streakDots");
  const markDoneRef = useTourTarget("markDone");
  const alreadyDoingRef = useTourTarget("alreadyDoing");
  const skipRef = useTourTarget("skip");
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const [confirmRoutineId, setConfirmRoutineId] = useState<string | null>(null);
  const [showAlreadyConfirm, setShowAlreadyConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const actionLocked = useRef(false);

  useEffect(() => { actionLocked.current = false; });
  useEffect(() => { setShowEvidence(false); }, [currentRoutine?.id]);
  const scrollTourTo = useCallback((y: number) => {
    scrollOffsetRef.current = y;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);
  useEffect(() => {
    registerScroller({ scrollTo: scrollTourTo, getOffset: () => scrollOffsetRef.current });
    return () => registerScroller(null);
  }, [registerScroller, scrollTourTo]);
  useEffect(() => {
    setHomeReady(!isLoading && !!currentRoutine);
    return () => setHomeReady(false);
  }, [isLoading, currentRoutine, setHomeReady]);

  const handleMarkDone = () => {
    if (actionLocked.current || hasMarkedToday || !currentRoutine) return;
    actionLocked.current = true;
    const completed = markDoneToday();
    if (completed) setCelebrationTitle(completed.title);
    if (Platform.OS === "ios") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else { Vibration.vibrate(80); }
  };

  return <PaperBackground>
    <StreakBrokenToast visible={streakBrokenToday} />
    {isLoading ? <View className="flex-1 items-center justify-center"><ActivityIndicator color={palette.warmGold} /></View>
      : !currentRoutine ? <View className="flex-1 items-center justify-center p-6">
        <Text className="font-tajawal-bold text-warmBrown text-2xl text-center">أتممت جميع السنن!</Text>
        <Text className="font-tajawal text-warmBrownLight text-lg text-center">جزاك الله خيراً، انتظر إضافة سنن جديدة</Text>
      </View> : <>
        <ScrollView ref={scrollRef} removeClippedSubviews={false} scrollEventThrottle={16}
          onScroll={event => { scrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
          contentContainerClassName="p-5 pb-[100px]" contentContainerStyle={{ paddingTop: insets.top + 12 }}>
          <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-5">روتين اليوم</Text>
          <StreakDots ref={streakDotsRef} count={streakCount} />
          <Card variant="home" className="mb-4">
            <View ref={cardRef} collapsable={false}>
            <Text className="font-amiri-bold text-[28px] text-warmBrown text-center mb-4">{currentRoutine.title}</Text>
            <Text className="font-tajawal text-warmBrownLight text-center mb-4">الترتيب للتعلّم والعرض، ولا يدل على ترتيب شرعي ملزم.</Text>
            </View>
            {remainingMembers.map(member => <View key={member.id} className="mb-6">
              <Text className="font-tajawal-bold text-xl text-warmBrown text-center mb-2">{member.title}</Text>
              <Text className="font-tajawal text-lg text-warmBrownLight text-center leading-8">{member.action}</Text>
              {showEvidence && member.hadiths.map((hadith, index) => <View key={index} className="mt-4">
                <Text className="font-amiri text-lg text-warmBrownLight text-center leading-8">{hadith.text}</Text>
                <Text className="font-tajawal text-warmBrown text-center">{hadith.source} — {({ sahih: "صحيح", hasan: "حسن", daif: "ضعيف" })[hadith.grading]}</Text>
              </View>)}
              {member.reward && <Text className="font-tajawal text-warmBrown text-center mt-3">الثواب والأجر: {member.reward}</Text>}
            </View>)}
            <TouchableOpacity accessibilityRole="button" onPress={() => setShowEvidence(value => !value)} className="py-3">
              <Text className="font-tajawal-bold text-warmGold text-center">{showEvidence ? "إخفاء الأدلة" : "عرض أدلة جميع السنن"}</Text>
            </TouchableOpacity>
          </Card>
          <View ref={markDoneRef} collapsable={false}>
            <Button title={hasMarkedToday ? "تم تسجيل الروتين اليوم" : "فعلت الروتين اليوم"} onPress={handleMarkDone}
              color={palette.oliveGreen} colorEnd={palette.oliveGreenDark} textColor={palette.white} disabled={hasMarkedToday} />
          </View>
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity ref={alreadyDoingRef} accessibilityRole="button" className="flex-1 py-4"
              onPress={() => { setConfirmRoutineId(currentRoutine.id); setShowAlreadyConfirm(true); }}>
              <Text className="font-tajawal-bold text-warmBrown text-center">أفعل الروتين بالفعل</Text>
            </TouchableOpacity>
            <TouchableOpacity ref={skipRef} accessibilityRole="button" className="flex-1 py-4"
              onPress={() => { setConfirmRoutineId(currentRoutine.id); setShowSkipConfirm(true); }}>
              <Text className="font-tajawal-bold text-warmBrown text-center">تأجيل الروتين</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <AlreadyDoingModal visible={showAlreadyConfirm} routineTitle={currentRoutine.title} onConfirm={() => {
          setShowAlreadyConfirm(false);
          if (confirmRoutineId === currentRoutine.id) markAlreadyDoing();
        }} onClose={() => setShowAlreadyConfirm(false)} />
        <SkipModal visible={showSkipConfirm} onConfirm={() => {
          setShowSkipConfirm(false);
          if (confirmRoutineId === currentRoutine.id) postponeRoutine();
        }} onClose={() => setShowSkipConfirm(false)} />
      </>}
    <StreakCompleteModal visible={celebrationTitle !== null} routineTitle={celebrationTitle ?? ""} onClose={() => setCelebrationTitle(null)} />
  </PaperBackground>;
}
