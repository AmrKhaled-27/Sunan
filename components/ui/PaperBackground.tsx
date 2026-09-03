import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface PaperBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  children,
  style,
}) => {
  return (
    <View className="flex-1 bg-parchment" style={style}>
      {/* Background paper texture with expo-image hardware caching */}
      <Image
        source={require("@/assets/images/paper-background.webp")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        className="opacity-60"
        priority="high"
        cachePolicy="memory-disk"
      />
      {/* Corner decorative foliage */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require("@/assets/images/leaves-top.png")}
          style={{
            position: "absolute",
            top: -10,
            left: -20,
            width: 150,
            height: 230,
            opacity: 0.5,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <Image
          source={require("@/assets/images/leaves-bottom.png")}
          style={{
            position: "absolute",
            bottom: 80,
            right: -40,
            width: 160,
            height: 230,
            opacity: 0.5,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      {children}
    </View>
  );
};
