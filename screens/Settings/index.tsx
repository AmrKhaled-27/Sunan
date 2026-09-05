import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSunnah } from "@/context/SunnahContext";
import { formatTime12h } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BatteryModal } from "./components/BatteryModal";
import { PrayerTimesRow } from "./components/PrayerTimesRow";
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
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean | null>(null);
  const [requestingNotif, setRequestingNotif] = useState(false);

  const checkNotificationPermission = useCallback(async () => {
    try {
      const perm = await Notifications.getPermissionsAsync();
      const granted = perm.status === "granted";
      setHasNotifPermission(granted);
    } catch (e) {
      console.warn("Error checking notification permissions", e);
    }
  }, []);

  useEffect(() => {
    checkNotificationPermission();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkNotificationPermission();
      }
    });

    return () => sub.remove();
  }, [checkNotificationPermission]);

  const handleToggleNotifications = async (enable: boolean) => {
    updateSettings({ notificationsEnabled: enable });
    if (!enable) return;

    // User turned on — try to get system permission
    try {
      setRequestingNotif(true);
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status === "granted") {
        setHasNotifPermission(true);
        return;
      }

      if (perm.canAskAgain) {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status === "granted") {
          setHasNotifPermission(true);
          return;
        }
      }

      // Permission denied — keep toggle ON but show the permission banner
      setHasNotifPermission(false);
    } catch (e) {
      console.warn("Could not request notification permissions", e);
    } finally {
      setRequestingNotif(false);
    }
  };

  /** Called from the permission banner's "enable" button */
  const handleRequestPermission = async () => {
    try {
      setRequestingNotif(true);
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status === "granted") {
        setHasNotifPermission(true);
        // Poke settings so SunnahContext's effect re-fires and schedules notifications
        updateSettings({ notificationsEnabled: true });
        return;
      }
      if (perm.canAskAgain) {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status === "granted") {
          setHasNotifPermission(true);
          updateSettings({ notificationsEnabled: true });
          return;
        }
      }
      // Can't ask again — send user to system settings
      await Linking.openSettings();
    } catch (e) {
      console.warn("Could not request notification permissions", e);
    } finally {
      setRequestingNotif(false);
    }
  };

  const timeLabel = formatTime12h(
    settings.endOfDayHour,
    settings.endOfDayMinute,
  );

  const handleReplayTour = () => {
    router.navigate("/");
    setTimeout(startTour, REPLAY_NAVIGATION_DELAY);
  };

  const isNotificationsActive = settings.notificationsEnabled;

  return (
    <PaperBackground>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-[115px]"
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
                value={isNotificationsActive}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: palette.switchTrackFalse,
                  true: palette.warmGold,
                }}
                thumbColor={palette.white}
              />
            }
          />

          {hasNotifPermission === false && settings.notificationsEnabled && (
            <View className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 my-3">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Ionicons
                  name="notifications-off-outline"
                  size={17}
                  color="#D97706"
                />
                <Text className="font-tajawal-bold text-amber-900 text-sm">
                  إذن الإشعارات غير مفعّل في الهاتف
                </Text>
              </View>
              <Text className="font-tajawal text-warmBrownLight text-xs leading-5 mb-3">
                لتلقي التذكيرات اليومية وتنبيهات حماية السلسلة، يحتاج التطبيق إلى إذن إرسال الإشعارات.
              </Text>
              <TouchableOpacity
                onPress={handleRequestPermission}
                disabled={requestingNotif}
                activeOpacity={0.8}
                className="bg-warmGold active:bg-warmGold/90 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
              >
                {requestingNotif ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="notifications-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text className="font-tajawal-bold text-white text-xs">
                      تفعيل إذن الإشعارات
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <SettingRow
            label="تذكير نهاية اليوم"
            description="هل فعلت السنة اليوم?"
            right={
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                disabled={!isNotificationsActive}
                accessibilityRole="button"
                accessibilityLabel={`تغيير وقت تذكير نهاية اليوم، الوقت الحالي ${timeLabel}`}
                accessibilityState={{
                  disabled: !isNotificationsActive,
                }}
                className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-4 py-2"
              >
                <Text
                  className={`font-tajawal-bold text-lg ${
                    isNotificationsActive
                      ? "text-warmGold"
                      : "text-warmBrownLight/40"
                  }`}
                >
                  {timeLabel}
                </Text>
              </TouchableOpacity>
            }
          />

          <PrayerTimesRow
            prayerTimes={prayerTimes}
            onRefresh={refreshPrayerTimes}
          />

          {Platform.OS === "android" && (
            <SettingRow
              label="الإشعارات لا تصل بانتظام؟"
              description="حل مشكلة توفير البطارية في أندرويد"
              right={
                <TouchableOpacity
                  onPress={() => setShowBatteryModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="حل مشكلة وصول الإشعارات"
                  className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-3 py-2"
                >
                  <Text className="font-tajawal-bold text-warmGold text-sm">
                    إرشادات
                  </Text>
                </TouchableOpacity>
              }
            />
          )}
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

      {/* Battery Optimization Info Modal (Android only) */}
      {Platform.OS === "android" && (
        <BatteryModal
          visible={showBatteryModal}
          onClose={() => setShowBatteryModal(false)}
        />
      )}

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
