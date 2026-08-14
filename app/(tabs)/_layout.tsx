import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C4A46C",
        tabBarInactiveTintColor: "#B0A89A",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#FAF7F0",
          borderTopWidth: 1,
          borderTopColor: "rgba(196, 164, 108, 0.2)",
          elevation: 5,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowColor: "#000",
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Tajawal_700Bold",
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
