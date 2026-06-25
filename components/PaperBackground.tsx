import React from 'react';
import { ImageBackground, StyleSheet, ViewStyle } from 'react-native';

interface PaperBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({ children, style }) => {
  return (
    <ImageBackground
      source={require('@/assets/images/paper-texture.png')}
      resizeMode="cover"
      style={[styles.background, style]}
      imageStyle={styles.image}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F5EFE0', // Fallback while image loads
  },
  image: {
    opacity: 0.6, // Subtle texture, not overpowering
  },
});
