import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
  accentColor?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  color = '#FAF7F0',
  accentColor = '#C4A46C',
}) => {
  return (
    <View 
      className="w-full mb-6 rounded-2xl overflow-hidden"
      style={[
        {
          backgroundColor: color,
          shadowColor: '#3D2E1F',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.10,
          shadowRadius: 16,
          elevation: 5,
          borderWidth: 1,
          borderColor: 'rgba(196, 164, 108, 0.25)',
        },
      ]}
    >
      {/* Decorative top accent line */}
      <View 
        style={{ 
          height: 3, 
          backgroundColor: accentColor,
          opacity: 0.6,
        }} 
      />

      <View className="p-6" style={style}>
        {/* Decorative corner ornament — top right */}
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 20,
          height: 20,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: 'rgba(196, 164, 108, 0.3)',
          borderTopRightRadius: 4,
        }} />

        {/* Decorative corner ornament — bottom left */}
        <View style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          width: 20,
          height: 20,
          borderBottomWidth: 1.5,
          borderLeftWidth: 1.5,
          borderColor: 'rgba(196, 164, 108, 0.3)',
          borderBottomLeftRadius: 4,
        }} />

        {children}
      </View>
    </View>
  );
};
