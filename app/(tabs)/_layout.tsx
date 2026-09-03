import { TourTarget } from "@/components/onboarding/TourTarget";
import { HapticTab } from "@/components/ui/HapticTab";
import { fonts, palette } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBarWithTourTarget(props: BottomTabBarProps) {
  return (
    <TourTarget
      tourKey="tabBar"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <BottomTabBar {...props} />
    </TourTarget>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <TabBarWithTourTarget {...props} />}
      screenOptions={{
        lazy: false,
        tabBarActiveTintColor: palette.warmGold,
        tabBarInactiveTintColor: palette.tabInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: palette.parchmentLight,
          borderTopWidth: 1,
          borderTopColor: "rgba(196, 164, 108, 0.2)",
          elevation: 5,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowColor: palette.black,
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.tajawalBold[0],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "سنة اليوم",
          tabBarLabel: "سنة اليوم",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "moon" : "moon-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="accomplished"
        options={{
          title: "الانجازات",
          tabBarLabel: "الانجازات",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarLabel: "الإعدادات",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
