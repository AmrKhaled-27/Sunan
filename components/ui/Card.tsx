import React from "react";
import { Image, View, ViewStyle } from "react-native";
import { palette } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  contentClassName?: string;
  color?: string;
  accentColor?: string;
  variant?: "default" | "home";
}

export const Card = React.forwardRef<View, CardProps>(function Card(
  {
    children,
    style,
    className = "",
    contentClassName = "px-5 py-6",
    color = palette.parchmentLight,
    accentColor = palette.warmGold,
    variant = "default",
  },
  ref,
) {
  if (variant === "home") {
    return (
      <View
        ref={ref}
        collapsable={false}
        className={`w-full mb-6 rounded-3xl bg-parchmentPure border border-warmGold/30 shadow-md shadow-warmBrown/8 overflow-hidden ${className}`}
        style={style}
      >
        {/* Soft manuscript corner foliage matching AccomplishedCard */}
        <Image
          source={require("@/assets/images/top-right-decorations.png")}
          className="absolute top-[-6] left-0 w-[125px] h-[125px] opacity-45"
          resizeMode="contain"
        />
        <Image
          source={require("@/assets/images/bottome-left-decorations.png")}
          className="absolute bottom-[-10] right-0 w-[125px] h-[125px] opacity-45"
          resizeMode="contain"
        />

        {/* Delicate inner gilded frame */}
        <View className="m-2.5 rounded-2xl border border-goldAccent/35 relative">
          <View className={contentClassName}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={ref}
      collapsable={false}
      className={`w-full mb-6 rounded-2xl overflow-hidden shadow-lg shadow-warmBrown/10 border border-warmGold/25 ${className}`}
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
});
