import React, { useRef } from 'react';
import { Pressable, Text, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  colorEnd?: string;
  textColor?: string;
  variant?: 'solid' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  color = '#8FAF8B',
  colorEnd,
  textColor = '#FFFFFF',
  variant = 'solid',
  style,
  textStyle 
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

  // Derive a slightly darker shade for the gradient end
  const gradientEnd = colorEnd || color;

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="mb-3 w-full"
      >
        <Animated.View
          style={[
            { transform: [{ scale }] },
            {
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: 'transparent',
            },
            style,
          ]}
          className="px-6 py-4 rounded-2xl items-center justify-center"
        >
          <Text 
            style={[
              { 
                color: color, 
                fontFamily: 'Amiri_700Bold',
              }, 
              textStyle,
            ]} 
            className="text-lg"
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
      className="mb-3 w-full"
    >
      <Animated.View
        style={[
          { 
            transform: [{ scale }],
            shadowColor: color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
            overflow: 'hidden',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          },
          style,
        ]}
      >
        <LinearGradient
          colors={[color, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text 
            style={[
              { 
                color: textColor, 
                fontFamily: 'Amiri_700Bold',
              }, 
              textStyle,
            ]} 
            className="text-lg"
          >
            {title}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};
