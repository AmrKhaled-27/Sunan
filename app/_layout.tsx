import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay";
import { TourOriginProbe } from "@/components/onboarding/TourOriginProbe";
import { palette } from "@/constants/theme";
import { OnboardingProvider } from "@/context/OnboardingContext";
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
import {
  ErrorBoundaryProps,
  Stack,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Image,
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

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 justify-center items-center bg-[#FAF7F0] px-6">
      <View className="bg-white/80 border border-warmGold/20 rounded-3xl p-6 w-full max-w-sm items-center shadow-sm">
        <Image
          source={require("@/assets/images/app-icon.png")}
          className="w-20 h-20 rounded-2xl mb-4 opacity-90"
          resizeMode="contain"
        />
        <Text className="font-tajawal-bold text-[22px] text-warmBrown text-center mb-2">
          حدث خطأ غير متوقع
        </Text>
        <Text className="font-tajawal text-warmBrownLight text-center text-sm mb-6 leading-6 opacity-80">
          نعتذر عن هذا الانقطاع. اضغط أدناه لإعادة تشغيل التطبيق والمتابعة.
        </Text>
        <TouchableOpacity
          onPress={() => {
            try {
              retry();
            } catch {
              // noop
            }
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="إعادة المحاولة"
          className="bg-warmGold active:bg-warmGold/90 w-full py-3.5 rounded-2xl shadow-sm items-center justify-center"
        >
          <Text className="font-tajawal-bold text-white text-base">
            إعادة المحاولة
          </Text>
        </TouchableOpacity>
      </View>
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
  const rootNavigationState = useRootNavigationState();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Configure Android navigation bar to match app's bottom bar theme
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(palette.parchmentLight).catch(
        console.warn,
      );
      NavigationBar.setButtonStyleAsync("dark").catch(console.warn);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Request notification permissions once fonts are loaded
      requestPermissions().catch(console.warn);
    }
  }, [fontsLoaded]);

  // Handle cold start tap safely once navigation tree is mounted
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (
      lastNotificationResponse?.actionIdentifier ===
      Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      try {
        router.replace("/(tabs)");
      } catch (e) {
        console.warn("Navigation on notification response skipped:", e);
      }
    }
  }, [lastNotificationResponse, rootNavigationState?.key, router]);

  // Handle foreground/background tap safely
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        if (!rootNavigationState?.key) return;
        try {
          router.replace("/(tabs)");
        } catch (e) {
          console.warn("Navigation on notification event skipped:", e);
        }
      },
    );
    return () => subscription.remove();
  }, [rootNavigationState?.key, router]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-parchment">
        <ActivityIndicator size="large" color={palette.warmGold} />
      </View>
    );
  }

  return (
    <SunnahProvider>
      <OnboardingProvider>
        <ThemeProvider value={CustomTheme}>
          {/* The tour overlay is a sibling of the navigator rather than a
              <Modal> so it can dim the tab bar and share its window
              coordinates with measureInWindow. */}
          <View className="flex-1">
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <TourOriginProbe />
            <SpotlightOverlay />
          </View>
          <StatusBar style="dark" />
        </ThemeProvider>
      </OnboardingProvider>
    </SunnahProvider>
  );
}
