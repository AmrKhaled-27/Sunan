import React from 'react';
import { View, ViewStyle } from 'react-native';

interface NeuCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}

export const NeuCard: React.FC<NeuCardProps> = ({ 
  children, 
  style, 
  color = '#FDFBF7' // Default to cream
}) => {
  return (
    <View className="relative w-full mb-6">
      {/* Shadow layer */}
      <View 
        className="absolute inset-0 bg-borderDark rounded-2xl" 
        style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
      />
      
      {/* Front layer */}
      <View 
        className="p-6 rounded-2xl border-4 border-borderDark"
        style={[{ backgroundColor: color }, style]}
      >
        {children}
      </View>
    </View>
  );
};
