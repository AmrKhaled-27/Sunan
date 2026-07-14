import { SunnahProvider } from "@/hooks/SunnahContext";
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
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, I18nManager, View } from "react-native";
import "react-native-reanimated";
import "../global.css";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export const unstable_settings = {
  anchor: "(tabs)",
};

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F5EFE0", // Parchment background
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
      <View className="flex-1 justify-center items-center bg-[#F5EFE0]">
        <ActivityIndicator size="large" color="#C4A46C" />
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
