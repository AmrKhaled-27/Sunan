import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay";
import { TourOriginProbe } from "@/components/onboarding/TourOriginProbe";
import { palette } from "@/constants/theme";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { SunnahProvider } from "@/context/SunnahContext";
import { initNotificationHandler, requestPermissions } from "@/services/notifications";
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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAF7F0",
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.8)",
          borderWidth: 1,
          borderColor: "rgba(196,164,108,0.2)",
          borderRadius: 24,
          padding: 24,
          width: "100%",
          maxWidth: 340,
          alignItems: "center",
        }}
      >
        <Image
          source={require("@/assets/images/app-icon.png")}
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            marginBottom: 16,
            opacity: 0.9,
          }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#5C4033",
            textAlign: "center",
            marginBottom: 8,
            writingDirection: "rtl",
          }}
        >
          حدث خطأ غير متوقع
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#8B7355",
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 24,
            opacity: 0.8,
            writingDirection: "rtl",
          }}
        >
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
          style={{
            backgroundColor: "#C4A46C",
            width: "100%",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              color: "#FFFFFF",
              fontSize: 16,
              writingDirection: "rtl",
            }}
          >
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

  // Initialize notification handler once native bridge is ready
  useEffect(() => {
    initNotificationHandler();
  }, []);

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

  // Handle foreground/background notification tap.
  // Cold-start taps don't need navigation since (tabs) is already the initial route.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        // Defer to ensure the navigation tree is fully mounted
        setTimeout(() => {
          try {
            router.replace("/(tabs)");
          } catch (e) {
            console.warn("Navigation on notification event skipped:", e);
          }
        }, 0);
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
