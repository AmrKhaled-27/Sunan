import { palette } from "@/constants/theme";
import { PrayerTimesResult } from "@/types";
import { formatTime12h } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PrayerTimesRowProps {
  prayerTimes: PrayerTimesResult | null;
  onRefresh: () => Promise<void>;
}

export function PrayerTimesRow({
  prayerTimes,
  onRefresh,
}: PrayerTimesRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      setRefreshing(true);
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === "granted") {
        await onRefresh();
        return;
      }
      if (perm.canAskAgain) {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status === "granted") {
          await onRefresh();
          return;
        }
      }
      // If permission is blocked/denied, take user directly to settings
      await Linking.openSettings();
    } catch (e) {
      console.warn("Could not request location", e);
    } finally {
      setRefreshing(false);
    }
  };

  const isFallback = prayerTimes?.source === "fallback" || !prayerTimes;

  const prayers = prayerTimes
    ? [
        {
          name: "الفجر",
          time: formatTime12h(
            prayerTimes.fajr.hour,
            prayerTimes.fajr.minute
          ),
        },
        {
          name: "الظهر",
          time: formatTime12h(
            prayerTimes.dhuhr.hour,
            prayerTimes.dhuhr.minute
          ),
        },
        {
          name: "العصر",
          time: formatTime12h(
            prayerTimes.asr.hour,
            prayerTimes.asr.minute
          ),
        },
        {
          name: "المغرب",
          time: formatTime12h(
            prayerTimes.maghrib.hour,
            prayerTimes.maghrib.minute
          ),
        },
        {
          name: "العشاء",
          time: formatTime12h(
            prayerTimes.ishaa.hour,
            prayerTimes.ishaa.minute
          ),
        },
      ]
    : [];

  return (
    <View className="border-b border-warmGold/10 py-3.5">
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="أوقات الصلاة"
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 ml-4">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-tajawal-bold text-warmBrown text-lg">
              أوقات الصلاة
            </Text>
            {isFallback && (
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#D97706"
              />
            )}
          </View>
          <Text
            className={`font-tajawal text-sm mt-0.5 leading-5 ${
              isFallback ? "text-amber-800" : "text-warmBrownLight"
            }`}
          >
            {isFallback
              ? "مواقيت تقريبية — فعّل الموقع لضبط مدينتك"
              : expanded
                ? "مضبوطة حسب موقعك الجغرافي"
                : "مضبوطة حسب موقعك (اضغط للعرض)"}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 mr-1">
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={palette.warmGold}
          />
        </View>
      </TouchableOpacity>

      {expanded && prayerTimes && (
        <View className="mt-3.5 pt-3 border-t border-warmGold/10">
          {/* Fallback Location Warning Card */}
          {isFallback && (
            <View className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 mb-3.5">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Ionicons name="location-outline" size={17} color="#D97706" />
                <Text className="font-tajawal-bold text-amber-900 text-sm">
                  مواقيت افتراضية وليست لمدينتك
                </Text>
              </View>
              <Text className="font-tajawal text-warmBrownLight text-xs leading-5 mb-3">
                لحساب مواعيد التذكيرات المناسبة لمدينتك بدقة، يحتاج التطبيق إلى إذن الموقع (تُحسب محلياً على جهازك دون اتصال ولا نجمع بياناتك).
              </Text>
              <TouchableOpacity
                onPress={handleRequestPermission}
                disabled={refreshing}
                activeOpacity={0.8}
                className="bg-warmGold active:bg-warmGold/90 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="navigate-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text className="font-tajawal-bold text-white text-xs">
                      تفعيل إذن الموقع وحساب الأوقات
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 5 Prayer Pills */}
          <View className="flex-row justify-between items-center gap-1.5 mb-3">
            {prayers.map((p) => (
              <View
                key={p.name}
                className="flex-1 bg-warmGold/10 border border-warmGold/20 rounded-xl py-2 px-0.5 items-center"
              >
                <Text className="font-tajawal-bold text-warmBrown text-xs mb-1">
                  {p.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-tajawal-bold text-warmGold text-[11px]"
                >
                  {p.time}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer note & refresh button */}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="font-tajawal text-warmBrownLight text-xs opacity-75 flex-1 ml-2">
              تُستخدم لحساب مواعيد التذكيرات تلقائياً
            </Text>

            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 bg-warmGold/15 border border-warmGold/30 px-3 py-1.5 rounded-xl"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={palette.warmGold} />
              ) : (
                <>
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={palette.warmGold}
                  />
                  <Text className="font-tajawal-bold text-warmGold text-xs">
                    تحديث
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
