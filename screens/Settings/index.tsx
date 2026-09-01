import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatTime12h } from "@/utils/date";
import { ResetModal } from "./components/ResetModal";
import { SettingRow } from "./components/SettingRow";
import { TimePicker } from "./components/TimePicker";

/** Lets the home tab mount and lay out before the tour measures its targets. */
const REPLAY_NAVIGATION_DELAY = 350;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    settings,
    updateSettings,
    prayerTimes,
    refreshPrayerTimes,
    resetAllProgress,
  } = useSunnah();
  const { startTour } = useOnboarding();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timeLabel = formatTime12h(settings.endOfDayHour, settings.endOfDayMinute);

  const handleReplayTour = () => {
    router.navigate("/");
    setTimeout(startTour, REPLAY_NAVIGATION_DELAY);
  };

  return (
    <PaperBackground>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-[100px]"
        contentContainerStyle={{ paddingTop: insets.top + 12 }}
      >
        <Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-6">
          الإعدادات
        </Text>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          الإشعارات
        </Text>

        <View className="bg-parchmentLight rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="تفعيل الإشعارات"
            description="تذكيرات يومية وتنبيهات السلسلة"
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) =>
                  updateSettings({ notificationsEnabled: v })
                }
                trackColor={{
                  false: palette.switchTrackFalse,
                  true: palette.warmGold,
                }}
                thumbColor={palette.white}
              />
            }
          />

          <SettingRow
            label="تذكير نهاية اليوم"
            description="هل فعلت السنة اليوم?"
            right={
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                disabled={!settings.notificationsEnabled}
                accessibilityRole="button"
                accessibilityLabel={`تغيير وقت تذكير نهاية اليوم، الوقت الحالي ${timeLabel}`}
                accessibilityState={{ disabled: !settings.notificationsEnabled }}
                className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-4 py-2"
              >
                <Text
                  className={`font-tajawal-bold text-lg ${
                    settings.notificationsEnabled
                      ? "text-warmGold"
                      : "text-warmBrownLight/40"
                  }`}
                >
                  {timeLabel}
                </Text>
              </TouchableOpacity>
            }
          />

          <SettingRow
            label="أوقات الصلاة"
            description={
              prayerTimes?.source === "calc" ||
              prayerTimes?.source === "api" ||
              prayerTimes?.source === "cache"
                ? "أوقات دقيقة حسب موقعك"
                : "أوقات صلاة تقريبية"
            }
            right={
              prayerTimes?.source === "fallback" || !prayerTimes ? (
                <TouchableOpacity
                  onPress={() => refreshPrayerTimes()}
                  accessibilityRole="button"
                  accessibilityLabel="تحديث أوقات الصلاة"
                  className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-3 py-2"
                >
                  <Text className="font-tajawal-bold text-warmGold text-sm">
                    تحديث
                  </Text>
                </TouchableOpacity>
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={palette.warmGold}
                />
              )
            }
          />
        </View>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          عن التطبيق
        </Text>
        <View className="bg-parchmentLight rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="إعادة عرض الشرح"
            description="جولة تعريفية سريعة على واجهة التطبيق"
            right={
              <TouchableOpacity
                onPress={handleReplayTour}
                accessibilityRole="button"
                accessibilityLabel="إعادة عرض الشرح"
                accessibilityHint="عرض الجولة التعريفية لواجهة التطبيق من جديد"
                className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-3 py-2"
              >
                <Text className="font-tajawal-bold text-warmGold text-sm">
                  عرض الشرح
                </Text>
              </TouchableOpacity>
            }
          />
          <SettingRow
            label="الإشعارات مخصصة لكل سنة"
            description="كل سنة لها أوقات تذكير مناسبة لها، مثل تذكير الطعام عند أوقات الأكل."
            right={
              <Ionicons
                name="notifications-outline"
                size={24}
                color={palette.warmGold}
              />
            }
          />
          <SettingRow
            label="خصوصية بياناتك"
            description="تُحسب أوقات الصلاة محلياً على جهازك دون اتصال. بياناتك محفوظة محلياً ولا نجمعها."
            right={
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={palette.warmGold}
              />
            }
          />
        </View>

        {/* ── Data Management / Testing ────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          إدارة البيانات
        </Text>
        <View className="bg-parchmentLight rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="إعادة ضبط التقدم"
            description="مسح الإنجازات والبدء من السنة الأولى من جديد"
            right={
              <TouchableOpacity
                onPress={() => setShowResetConfirm(true)}
                accessibilityRole="button"
                accessibilityLabel="مسح وبدء من جديد"
                accessibilityHint="مسح جميع بيانات التقدم وسلسلة الأيام والبدء من جديد"
                className="bg-red-50 border border-red-200 rounded-xl px-3 py-2"
              >
                <Text className="font-tajawal-bold text-red-600 text-sm">
                  مسح وبدء من جديد
                </Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* ── App version ───────────────────────────────────────────────────── */}
        <Text className="font-tajawal text-warmBrownLight text-sm text-center mt-2 opacity-50">
          سنن · الإصدار 1.0.0
        </Text>
      </ScrollView>

      <TimePicker
        visible={showTimePicker}
        hour={settings.endOfDayHour}
        minute={settings.endOfDayMinute}
        onConfirm={(h, m) => {
          updateSettings({ endOfDayHour: h, endOfDayMinute: m });
          setShowTimePicker(false);
        }}
        onClose={() => setShowTimePicker(false)}
      />

      {/* Reset Progress Modal */}
      <ResetModal
        visible={showResetConfirm}
        onConfirm={async () => {
          setShowResetConfirm(false);
          await resetAllProgress();
        }}
        onClose={() => setShowResetConfirm(false)}
      />
    </PaperBackground>
  );
}
