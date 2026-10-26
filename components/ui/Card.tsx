import React from "react";
import { View, ViewStyle } from "react-native";
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
    contentClassName = "px-5 py-8",
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
        className={`w-full mb-6 rounded-3xl bg-parchmentPure border border-warmGold/35 shadow-md shadow-warmBrown/5 overflow-hidden ${className}`}
        style={style}
      >
        {/* Subtle decorative gilded inner hairline */}
        <View className="m-2 rounded-2xl border border-warmGold/20 relative">
          {/* Subtle Islamic corner motifs (crisp hairline vectors) */}
          <View
            pointerEvents="none"
            className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-warmGold/50 rounded-tr"
          />
          <View
            pointerEvents="none"
            className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-warmGold/50 rounded-tl"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-warmGold/50 rounded-br"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-warmGold/50 rounded-bl"
          />

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
