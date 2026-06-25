import React, { useRef } from 'react';
import { Pressable, Text, Animated, ViewStyle, TextStyle } from 'react-native';

interface NeuButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const NeuButton: React.FC<NeuButtonProps> = ({ 
  title, 
  onPress, 
  color = '#82A991', // Default to mutedGreen
  style,
  textStyle 
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const shadowTranslateY = useRef(new Animated.Value(4)).current;
  const shadowTranslateX = useRef(new Animated.Value(4)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowTranslateY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowTranslateX, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowTranslateY, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowTranslateX, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="relative mb-4 w-full"
    >
      {/* Shadow layer */}
      <Animated.View
        style={{
          transform: [
            { translateX: shadowTranslateX },
            { translateY: shadowTranslateY },
          ],
        }}
        className="absolute inset-0 bg-borderDark rounded-xl"
      />
      
      {/* Front layer */}
      <Animated.View
        style={[
          { transform: [{ translateY }] },
          { backgroundColor: color },
          style,
        ]}
        className="px-6 py-4 rounded-xl border-4 border-borderDark items-center justify-center"
      >
        <Text style={textStyle} className="text-xl font-bold text-borderDark">
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
