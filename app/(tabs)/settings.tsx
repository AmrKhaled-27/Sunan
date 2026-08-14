import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaperBackground } from "@/components/PaperBackground";
import { Button } from "@/components/Button";
import { useSunnah } from "@/hooks/SunnahContext";
import { Ionicons } from "@expo/vector-icons";

// ─── Time Picker Modal ────────────────────────────────────────────────────────

function TimePicker({
  visible,
  hour,
  minute,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-[#FAF7F0] rounded-2xl p-6 w-full">
          <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-6">
            اختر وقت التذكير
          </Text>

          {/* Hour */}
          <Text className="font-tajawal text-warmBrownLight text-center mb-2">
            الساعة
          </Text>
          <View className="flex-row justify-center items-center gap-4 mb-5">
            <TouchableOpacity
              onPress={() => setH((prev) => (prev - 1 + 24) % 24)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-4xl w-16 text-center">
              {pad(h)}
            </Text>
            <TouchableOpacity
              onPress={() => setH((prev) => (prev + 1) % 24)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          {/* Minute */}
          <Text className="font-tajawal text-warmBrownLight text-center mb-2">
            الدقيقة
          </Text>
          <View className="flex-row justify-center items-center gap-4 mb-6">
            <TouchableOpacity
              onPress={() => setM((prev) => (prev === 0 ? 45 : prev - 15))}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-tajawal-bold text-warmBrown text-4xl w-16 text-center">
              {pad(m)}
            </Text>
            <TouchableOpacity
              onPress={() => setM((prev) => (prev + 15) % 60)}
              className="w-10 h-10 rounded-full bg-warmGold/10 border border-warmGold/30 items-center justify-center"
            >
              <Text className="text-warmGold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => onConfirm(h, m)}
            className="bg-warmGold rounded-xl py-3 mb-3 items-center"
          >
            <Text className="font-tajawal-bold text-white text-xl">تأكيد</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="items-center py-2">
            <Text className="font-tajawal text-warmBrownLight text-base">
              إلغاء
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  right,
}: {
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-warmGold/10">
      <View className="flex-1 ml-4">
        <Text className="font-tajawal-bold text-warmBrown text-lg">
          {label}
        </Text>
        {description && (
          <Text className="font-tajawal text-warmBrownLight text-sm mt-0.5 leading-5">
            {description}
          </Text>
        )}
      </View>
      <View className="mr-1">{right}</View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateSettings,
    totalCompleted,
    longestStreak,
    prayerTimes,
    refreshPrayerTimes,
    resetAllProgress,
  } = useSunnah();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeLabel = `${pad(settings.endOfDayHour)}:${pad(settings.endOfDayMinute)}`;

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

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <View className="mb-6">
          <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
            إحصائياتك
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-4 items-center">
              <Text className="font-tajawal-bold text-warmGold text-3xl">
                {totalCompleted}
              </Text>
              <Text className="font-tajawal text-warmBrownLight text-sm text-center mt-1">
                سنن مكتملة
              </Text>
            </View>
            <View className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl px-4 py-4 items-center">
              <Text className="font-tajawal-bold text-warmGold text-3xl">
                {longestStreak}
              </Text>
              <Text className="font-tajawal text-warmBrownLight text-sm text-center mt-1">
                أطول سلسلة
              </Text>
            </View>
          </View>
        </View>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          الإشعارات
        </Text>

        <View className="bg-[#FAF7F0] rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="تفعيل الإشعارات"
            description="تذكيرات يومية وتنبيهات السلسلة"
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) =>
                  updateSettings({ notificationsEnabled: v })
                }
                trackColor={{ false: "#D4C9B8", true: "#C4A46C" }}
                thumbColor="#FFFFFF"
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
              prayerTimes?.source === "api" || prayerTimes?.source === "cache"
                ? "أوقات دقيقة حسب موقعك"
                : "أوقات صلاة تقريبية"
            }
            right={
              prayerTimes?.source === "fallback" || !prayerTimes ? (
                <TouchableOpacity
                  onPress={() => refreshPrayerTimes()}
                  className="bg-warmGold/10 border border-warmGold/30 rounded-xl px-3 py-2"
                >
                  <Text className="font-tajawal-bold text-warmGold text-sm">
                    تحديث
                  </Text>
                </TouchableOpacity>
              ) : (
                <Ionicons name="checkmark-circle" size={28} color="#C4A46C" />
              )
            }
          />
        </View>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          عن التطبيق
        </Text>
        <View className="bg-[#FAF7F0] rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="كيف يعمل التطبيق؟"
            description="تحصل على سنة واحدة، وإذا طبّقتها 7 أيام متتالية انتقلت للسنة التالية."
            right={<Ionicons name="book-outline" size={24} color="#C4A46C" />}
          />
          <SettingRow
            label="الإشعارات مخصصة لكل سنة"
            description="كل سنة لها أوقات تذكير مناسبة لها، مثل تذكير الطعام عند أوقات الأكل."
            right={
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#C4A46C"
              />
            }
          />
          <SettingRow
            label="خصوصية بياناتك"
            description="نجلب أوقات الصلاة من الإنترنت فقط. بياناتك الشخصية محفوظة محلياً ولا نجمعها."
            right={
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#C4A46C"
              />
            }
          />
        </View>

        {/* ── Data Management / Testing ────────────────────────────────────── */}
        <Text className="font-tajawal-bold text-warmGold text-lg mb-3 mr-1">
          إدارة البيانات
        </Text>
        <View className="bg-[#FAF7F0] rounded-2xl px-4 shadow-sm border border-warmGold/10 mb-6">
          <SettingRow
            label="إعادة ضبط التقدم"
            description="مسح الإنجازات والبدء من السنة الأولى من جديد"
            right={
              <TouchableOpacity
                onPress={() => setShowResetConfirm(true)}
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
      <Modal transparent animationType="fade" visible={showResetConfirm}>
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-[#FAF7F0] rounded-2xl p-6 w-full">
            <Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-3">
              إعادة ضبط البيانات؟
            </Text>
            <Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8 mb-6">
              سيتم مسح جميع الإحصائيات، السلاسل، والسنن المكتملة، والبدء من جديد من أول سنة.
            </Text>
            <Button
              title="نعم، امسح وابدأ من جديد"
              onPress={async () => {
                setShowResetConfirm(false);
                await resetAllProgress();
              }}
              color="#DC2626"
              colorEnd="#B91C1C"
              textColor="#FFFFFF"
            />
            <Button
              title="إلغاء"
              onPress={() => setShowResetConfirm(false)}
              variant="ghost"
              color="#A89A84"
            />
          </View>
        </View>
      </Modal>
    </PaperBackground>
  );
}
