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
      <View pointerEvents="none" className="absolute inset-0">
        <Image
          source={require("@/assets/images/leaves-top.png")}
          className="absolute -top-[-20] -left-[60] w-[200px] h-[200px]"
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <Image
          source={require("@/assets/images/leaves-bottom.png")}
          className="absolute -bottom-[-30] -right-20 w-[200px] h-[200px]"
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      {children}
    </View>
  );
};
