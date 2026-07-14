import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";
import React, { useRef } from "react";
import { Animated, Pressable, Text, TextStyle, ViewStyle } from "react-native";

cssInterop(LinearGradient, { className: "style" });
cssInterop(Animated.View, { className: "style" });

interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  colorEnd?: string;
  textColor?: string;
  variant?: "solid" | "ghost";
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  color = "#90937A",
  colorEnd,
  textColor = "#FFFFFF",
  variant = "solid",
  style,
  textStyle,
  className = "",
  disabled = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const gradientEnd = colorEnd || color;

  if (variant === "ghost") {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className={`mb-3 w-full ${className}`}
      >
        <Animated.View
          style={[
            { transform: [{ scale }] },
            {
              borderColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            style,
          ]}
          className="border-[1.5px] bg-white/40 px-6 py-4 rounded-2xl items-center justify-center"
        >
          <Text
            style={[{ color: color }, textStyle]}
            className="font-amiri-bold text-lg"
          >
            {title}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className={`mb-3 w-full ${className}`}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            opacity: disabled ? 0.5 : 1,
            shadowColor: color,
            backgroundColor: color,
          },
          style,
        ]}
        className="shadow-md rounded-2xl border border-white/30 border-b-[3px] border-b-black/20"
      >
        <LinearGradient
          colors={[color, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-4 items-center justify-center rounded-[15px]"
        >
          <Text
            style={[{ color: textColor }, textStyle]}
            className="font-amiri-bold text-lg"
          >
            {title}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};
