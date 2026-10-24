import { Card } from "@/components/ui/Card";
import { ArabicText } from "@/components/ui/ArabicText";
import { useTourTarget } from "@/components/onboarding/TourTarget";
import { Button } from "@/components/ui/Button";
import { BaseModal } from "@/components/ui/BaseModal";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlreadyDoingModal } from "./components/AlreadyDoingModal";
import { RoutineActionsPanel } from "./components/RoutineActionsPanel";
import { RoutineMenu } from "./components/RoutineMenu";
import { RoutineRewardsPanel } from "./components/RoutineRewardsPanel";
import { RoutineSourcesModal } from "./components/RoutineSourcesModal";
import { SkipModal } from "./components/SkipModal";
import { StreakBrokenToast } from "./components/StreakBrokenToast";
import { StreakCompleteModal } from "./components/StreakCompleteModal";
import { StreakDots } from "./components/StreakDots";

type Dialog = "sources" | "menu" | "already" | "postpone" | null;
type DialogSelection = {
  type: Exclude<Dialog, null>;
  routineId: string;
} | null;
type Celebration = { title: string; members: string[] };

export default function ActiveSunnahScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentRoutine,
    remainingMembers,
    streakCount,
    hasMarkedToday,
    streakBrokenToday,
    markDoneToday,
    markAlreadyDoing,
    postponeRoutine,
    isLoading,
  } = useSunnah();
  const { registerScroller, setHomeReady } = useOnboarding();
  const cardRef = useTourTarget("card");
  const streakDotsRef = useTourTarget("streakDots");
  const markDoneRef = useTourTarget("markDone");
  const menuRef = useTourTarget("routineMenu");
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const [dialogSelection, setDialogSelection] = useState<DialogSelection>(null);
  const dialogRef = useRef<DialogSelection>(null);
  // Bind dialogs to the routine that opened them. A rotation must hide them
  // during render, before the reset effect can run or native events can arrive.
  const dialog =
    dialogSelection?.routineId === currentRoutine?.id
      ? (dialogSelection?.type ?? null)
      : null;
  const setDialog = useCallback(
    (type: Dialog) => {
      const selection =
        type && currentRoutine ? { type, routineId: currentRoutine.id } : null;
      dialogRef.current = selection;
      setDialogSelection(selection);
    },
    [currentRoutine],
  );
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const actionLocked = useRef(false);
  const currentActionRef = useRef(markDoneToday);
  currentActionRef.current = markDoneToday;
  // A synchronous guard covers taps before React commits the context snapshot.
  useEffect(() => {
    actionLocked.current = false;
  }, [markDoneToday, markAlreadyDoing, postponeRoutine]);
  useEffect(() => {
    setDialog(null);
    scrollOffsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentRoutine?.id, setDialog]);

  const scrollTourTo = useCallback((y: number) => {
    scrollOffsetRef.current = y;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);
  useEffect(() => {
    registerScroller({
      scrollTo: scrollTourTo,
      getOffset: () => scrollOffsetRef.current,
      getViewport: () => viewportRef.current,
    });
    return () => registerScroller(null);
  }, [registerScroller, scrollTourTo]);
  useEffect(() => {
    setHomeReady(!isLoading && !!currentRoutine && !dialog && !celebration);
    return () => setHomeReady(false);
  }, [isLoading, currentRoutine, dialog, celebration, setHomeReady]);

  const handleMarkDone = () => {
    if (
      currentActionRef.current !== markDoneToday ||
      actionLocked.current ||
      hasMarkedToday ||
      !currentRoutine ||
      !remainingMembers.length ||
      dialogRef.current ||
      celebration
    )
      return;
    actionLocked.current = true;
    const memberTitles = remainingMembers.map((member) => member.title);
    const completed = markDoneToday();
    if (completed)
      setCelebration({ title: completed.title, members: memberTitles });
    if (Platform.OS === "ios") {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    } else if (Platform.OS === "android") Vibration.vibrate(80);
  };
  const confirmSecondary = (action: "already" | "postpone") => {
    if (
      currentActionRef.current !== markDoneToday ||
      actionLocked.current ||
      dialogRef.current?.type !== action ||
      dialogRef.current.routineId !== currentRoutine?.id
    )
      return;
    actionLocked.current = true;
    setDialog(null);
    if (action === "already") markAlreadyDoing();
    else postponeRoutine();
    // Postponing the only unfinished routine can keep its identity and count.
    // The confirmation closes immediately; context also rejects stale callbacks.
    requestAnimationFrame(() => {
      actionLocked.current = false;
    });
  };

  return (
    <PaperBackground>
      <StreakBrokenToast visible={streakBrokenToday} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.warmGold} />
        </View>
      ) : !currentRoutine ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-warmGold/15 items-center justify-center mb-6">
            <Ionicons
              name="leaf-outline"
              size={38}
              color={palette.oliveGreenDark}
            />
          </View>
          <ArabicText
            align="center"
            className="font-amiri-bold text-warmBrown text-3xl mb-3"
          >
            أتممت جميع السنن!
          </ArabicText>
          <ArabicText
            align="center"
            className="font-tajawal text-warmBrownLight text-lg leading-8"
          >
            جزاك الله خيراً. واصل المداومة على ما تعلّمت، وكلّ يوم فرصة لتُحيي
            سنّة.
          </ArabicText>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View ref={viewportRef} collapsable={false} style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
              removeClippedSubviews={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
              }}
              contentContainerStyle={{
                paddingTop: insets.top + 16,
                paddingBottom: 24,
                paddingHorizontal: Math.max(20, insets.left, insets.right),
                width: "100%",
                maxWidth: 680,
                alignSelf: "center",
              }}
            >
              <ArabicText
                align="center"
                accessibilityRole="header"
                className="font-tajawal-bold text-[28px] text-warmBrown mb-3"
              >
                سنن اليوم
              </ArabicText>
              <Card
                variant="home"
                className="mb-5"
                contentClassName="px-4 pt-5 pb-5"
              >
                <ArabicText
                  align="center"
                  accessibilityRole="header"
                  className="font-amiri-bold text-[30px] leading-[46px] text-warmBrown"
                >
                  {currentRoutine.title}
                </ArabicText>
                <ArabicText
                  align="center"
                  className="font-tajawal text-warmBrownLight text-base leading-7 mt-2"
                >
                  {currentRoutine.intro ??
                    "نُحييها اليوم، ونُداوم عليها كلّ يوم"}
                </ArabicText>
                <Pressable
                  ref={menuRef}
                  collapsable={false}
                  accessibilityRole="button"
                  accessibilityLabel="خيارات المجموعة"
                  accessibilityHint="إضافة جميع السنن إلى إنجازاتك أو تأجيلها"
                  accessibilityState={{ expanded: dialog === "menu" }}
                  onPress={() => setDialog("menu")}
                  className="self-center flex-row items-center justify-center gap-2 rounded-xl border border-warmGold/40 bg-parchmentLight px-4 py-2 min-h-11 mt-4"
                  style={{ direction: "rtl" }}
                >
                  <ArabicText
                    align="center"
                    className="shrink font-tajawal-bold text-warmBrownLight text-sm"
                  >
                    خيارات المجموعة
                  </ArabicText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={palette.warmBrownLight}
                  />
                </Pressable>
                <View
                  ref={streakDotsRef}
                  collapsable={false}
                  className="border-t border-warmGold/25 mt-5 pt-5"
                >
                  <StreakDots count={streakCount} />
                  <ArabicText
                    align="center"
                    className="font-tajawal text-warmBrownLight text-sm leading-6 mt-3"
                  >
                    {streakCount === 0
                      ? "سبعة أيام نحو المداومة"
                      : "أتممت " +
                        streakCount.toLocaleString("ar-EG") +
                        " من ٧ أيام"}
                  </ArabicText>
                </View>
              </Card>
              <RoutineRewardsPanel
                key={currentRoutine.id}
                members={remainingMembers}
              />
              {remainingMembers.length > 0 && (
                <RoutineActionsPanel ref={cardRef} members={remainingMembers} />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="عرض المصادر"
                accessibilityHint="قراءة جميع أحاديث هذه السنن ومصادرها ودرجاتها"
                onPress={() => setDialog("sources")}
                className="flex-row items-center justify-center gap-2 min-h-14 mt-4 rounded-2xl border border-warmGold/30 bg-parchmentLight"
                style={{ direction: "rtl" }}
              >
                <Ionicons
                  name="book-outline"
                  size={19}
                  color={palette.warmBrownLight}
                />
                <ArabicText className="font-tajawal-bold text-warmBrownLight text-base">
                  عرض المصادر
                </ArabicText>
              </Pressable>
            </ScrollView>
          </View>
          {/* Normal flex layout reserves the footer's measured height. The tab bar
              is also in flow, including its bottom safe area, so nothing overlaps. */}
          <View
            className="bg-parchmentLight border-t border-warmGold/25 pt-3 pb-2"
            style={{
              paddingHorizontal: Math.max(20, insets.left, insets.right),
            }}
          >
            <View style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}>
              <ArabicText
                align="center"
                accessibilityLiveRegion="polite"
                className="font-tajawal text-warmBrownLight text-sm leading-6 mb-2"
              >
                {hasMarkedToday
                  ? "تقبّل الله منك، نلتقي غداً على خير"
                  : "ضغطة واحدة لتسجيل جميع سنن هذه المجموعة"}
              </ArabicText>
              <View ref={markDoneRef} collapsable={false}>
                <Button
                  title={hasMarkedToday ? "تمّ اليوم ✓" : "فعلتها اليوم"}
                  accessibilityLabel={
                    hasMarkedToday
                      ? "تم تسجيل جميع هذه السنن اليوم"
                      : "فعلت جميع هذه السنن اليوم"
                  }
                  onPress={handleMarkDone}
                  color={palette.oliveGreenDark}
                  colorEnd="#666B52"
                  disabled={
                    hasMarkedToday ||
                    remainingMembers.length === 0 ||
                    !!celebration
                  }
                  className="mb-0"
                />
              </View>
            </View>
          </View>
          <RoutineSourcesModal
            key={`sources:${currentRoutine.id}`}
            visible={dialog === "sources"}
            title={currentRoutine.title}
            members={remainingMembers}
            onClose={() => setDialog(null)}
          />
          <BaseModal
            visible={
              dialog === "menu" || dialog === "already" || dialog === "postpone"
            }
            onClose={() => setDialog(null)}
          >
            {dialog === "menu" && (
              <RoutineMenu
                title={currentRoutine.title}
                onClose={() => setDialog(null)}
                onAlreadyDoing={() => setDialog("already")}
                onPostpone={() => setDialog("postpone")}
              />
            )}
            {dialog === "already" && (
              <AlreadyDoingModal
                embedded
                visible={dialog === "already"}
                routineTitle={currentRoutine.title}
                onConfirm={() => confirmSecondary("already")}
                onClose={() => setDialog(null)}
              />
            )}
            {dialog === "postpone" && (
              <SkipModal
                embedded
                visible={dialog === "postpone"}
                routineTitle={currentRoutine.title}
                onConfirm={() => confirmSecondary("postpone")}
                onClose={() => setDialog(null)}
              />
            )}
          </BaseModal>
        </View>
      )}
      <StreakCompleteModal
        visible={celebration !== null}
        routineTitle={celebration?.title ?? ""}
        memberTitles={celebration?.members ?? []}
        onClose={() => setCelebration(null)}
      />
    </PaperBackground>
  );
}
