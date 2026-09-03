import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/theme";

interface StreakBrokenToastProps {
  visible: boolean;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export function StreakBrokenToast({
  visible,
  onDismiss,
  autoHideDuration = 4500,
}: StreakBrokenToastProps) {
  const insets = useSafeAreaInsets();
  const [shouldRender, setShouldRender] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShouldRender(false);
      onDismiss?.();
    });
  };

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 14,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimer.current = setTimeout(() => {
        dismiss();
      }, autoHideDuration);
    } else {
      dismiss();
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [visible, autoHideDuration]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 20,
        right: 20,
        zIndex: 999,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="إغلاق التنبيه"
        className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-md flex-row items-center justify-between"
      >
        <Ionicons name="close" size={18} color="#991B1B" style={{ opacity: 0.7 }} />
        <Text className="font-tajawal-bold text-red-800 text-sm text-center flex-1 mx-2 leading-5">
          انقطعت سلسلتك بسبب يوم فائت. ابدأ من جديد! 🌱
        </Text>
        <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
      </Pressable>
    </Animated.View>
  );
}
