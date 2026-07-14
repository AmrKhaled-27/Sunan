import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
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
          height: 70,
          paddingBottom: 12,
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="book.closed.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accomplished"
        options={{
          title: "الانجازات",
          tabBarLabel: "الانجازات",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="checkmark.seal.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarLabel: "الإعدادات",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
