import React from "react";
import { Image, ImageBackground, View, ViewStyle } from "react-native";

interface PaperBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  children,
  style,
}) => {
  return (
    <ImageBackground
      source={require("@/assets/images/paper-background.png")}
      resizeMode="cover"
      className="flex-1 bg-parchment"
      style={style}
      imageClassName="opacity-60"
    >
      <View pointerEvents="none" className="absolute inset-0">
        <Image
          source={require("@/assets/images/leaves-top.png")}
          className="absolute -top-[-20] -left-[60] w-[200px] h-[200px] "
          resizeMode="contain"
        />
        <Image
          source={require("@/assets/images/leaves-bottom.png")}
          className="absolute -bottom-[-30] -right-20 w-[200px] h-[200px]"
          resizeMode="contain"
        />
      </View>
      {children}
    </ImageBackground>
  );
};
