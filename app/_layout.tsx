import { palette } from "@/constants/theme";
import { SunnahProvider } from "@/context/SunnahContext";
import { requestPermissions } from "@/services/notifications";
import {
  Amiri_400Regular,
  Amiri_700Bold,
  useFonts,
} from "@expo-google-fonts/amiri";
import {
  Tajawal_400Regular,
  Tajawal_700Bold,
} from "@expo-google-fonts/tajawal";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { ErrorBoundaryProps, Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-reanimated";
import "../global.css";

// Set native window background to parchmentLight matching the nav bar
SystemUI.setBackgroundColorAsync(palette.parchmentLight);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 justify-center items-center bg-parchment px-8">
      <Text className="text-5xl opacity-30 mb-4">⚠️</Text>
      <Text className="font-tajawal-bold text-[22px] text-warmBrown text-center mb-2">
        حدث خطأ غير متوقع
      </Text>
      <Text className="font-tajawal text-warmBrownLight text-center mb-6 leading-6">
        نعتذر عن هذا الخطأ. يمكنك إعادة المحاولة للمتابعة.
      </Text>
      <TouchableOpacity
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="إعادة المحاولة"
        className="bg-warmGold px-6 py-3 rounded-xl shadow-sm"
      >
        <Text className="font-tajawal-bold text-white text-base">
          إعادة المحاولة
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.parchment,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Tajawal_400Regular,
    Tajawal_700Bold,
  });

  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Configure Android transparent navigation bar
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setPositionAsync("absolute");
      NavigationBar.setBackgroundColorAsync("#00000000");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Request notification permissions once fonts are loaded
      requestPermissions().catch(console.warn);
    }
  }, [fontsLoaded]);

  // Handle cold start tap
  useEffect(() => {
    if (
      lastNotificationResponse?.actionIdentifier ===
      Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      router.replace("/(tabs)");
    }
  }, [lastNotificationResponse, router]);

  // Handle foreground/background tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.replace("/(tabs)");
      },
    );
    return () => subscription.remove();
  }, [router]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-parchment">
        <ActivityIndicator size="large" color={palette.warmGold} />
      </View>
    );
  }

  return (
    <SunnahProvider>
      <ThemeProvider value={CustomTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SunnahProvider>
  );
}
