import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  color?: string;
  accentColor?: string;
  variant?: "default" | "home";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  className = "",
  color = "#FAF7F0",
  accentColor = "#C4A46C",
  variant = "default",
}) => {
  if (variant === "home") {
    return (
      <View className={`w-full mb-6 mt-7 ${className}`} style={style}>
        {/* Main Background & Decorations (with overflow hidden to clip images to rounded corners) */}
        <View className="absolute inset-0 bg-[#FFFCF5] rounded-3xl shadow-sm shadow-black/5 overflow-hidden">
          <Image
            source={require("../assets/images/top-right-decorations.png")}
            className="absolute top-[-5] left-0 w-[140px] h-[140px] opacity-40"
            resizeMode="contain"
          />
          <Image
            source={require("../assets/images/bottome-left-decorations.png")}
            className="absolute bottom-[-12] right-0 w-[140px] h-[140px] opacity-40"
            resizeMode="contain"
          />
        </View>

        {/* Top Badge */}
        <View className="absolute -top-7 self-center w-14 h-14 rounded-full bg-[#C4A46C] border-[3px] border-[#FFFCF5] items-center justify-center z-20 shadow-md shadow-black/10">
          <MaterialCommunityIcons
            name="flower-tulip"
            size={26}
            color="#FFFFFF"
          />
        </View>

        {/* Inner Content (No background) */}
        <View className="m-3.5 mt-8 rounded-2xl border-[1.5px] border-[#D4AF37]/50 min-h-[200px] z-10">
          <View className="px-5 py-8">{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`w-full mb-6 rounded-2xl overflow-hidden shadow-lg shadow-[#3D2E1F]/10 border border-warmGold/25 ${className}`}
      style={[{ backgroundColor: color }, style]}
    >
      {/* Decorative top accent line */}
      <View
        className="h-[3px] opacity-60"
        style={{ backgroundColor: accentColor }}
      />

      <View className="p-6">
        {/* Decorative corner ornament — top right */}
        <View className="absolute top-3 right-3 w-5 h-5 border-t-[1.5px] border-r-[1.5px] border-warmGold/30 rounded-tr-md" />

        {/* Decorative corner ornament — bottom left */}
        <View className="absolute bottom-3 left-3 w-5 h-5 border-b-[1.5px] border-l-[1.5px] border-warmGold/30 rounded-bl-md" />

        {children}
      </View>
    </View>
  );
};
