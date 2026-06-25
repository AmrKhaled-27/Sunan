import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSunnah } from '@/hooks/SunnahContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PaperBackground } from '@/components/PaperBackground';

export default function ActiveSunnahScreen() {
  const insets = useSafeAreaInsets();
  const { 
    currentSunnah, 
    streakCount, 
    markDoneToday, 
    markAlreadyDoing, 
    skipSunnah,
    isLoading
  } = useSunnah();

  if (isLoading) {
    return (
      <PaperBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#C4A46C" />
        </View>
      </PaperBackground>
    );
  }

  if (!currentSunnah) {
    return (
      <PaperBackground>
        <View className="flex-1 justify-center items-center p-4" style={{ paddingTop: insets.top }}>
          <Text style={{ fontFamily: 'Amiri_700Bold', color: '#3D2E1F', fontSize: 20 }}>
            لا يوجد سنن حالية.
          </Text>
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ 
          padding: 20, 
          paddingTop: insets.top + 12,
          paddingBottom: 90,
        }}
      >
        
        {/* Page Title */}
        <Text style={{ 
          fontFamily: 'Amiri_700Bold', 
          fontSize: 26, 
          color: '#3D2E1F',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          سنة اليوم
        </Text>

        {/* Streak Indicator */}
        <View className="flex-row justify-center items-center mb-8">
          <View 
            className="px-6 py-2 rounded-full"
            style={{
              backgroundColor: 'rgba(196, 164, 108, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(196, 164, 108, 0.3)',
            }}
          >
            <Text style={{ 
              fontFamily: 'Amiri_700Bold', 
              color: '#C4A46C', 
              fontSize: 16,
            }}>
              اليوم {streakCount + 1} من 7
            </Text>
          </View>
        </View>

        {/* Sunnah Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontFamily: 'Amiri_700Bold', 
            fontSize: 28, 
            color: '#3D2E1F', 
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 44,
          }}>
            {currentSunnah.action}
          </Text>

          {/* Decorative divider */}
          <View className="flex-row items-center justify-center mb-4">
            <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(196,164,108,0.3)' }} />
            <Text style={{ marginHorizontal: 12, color: '#C4A46C', fontSize: 14 }}>✦</Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(196,164,108,0.3)' }} />
          </View>

          <Text style={{ 
            fontFamily: 'Amiri_400Regular', 
            fontSize: 18, 
            color: '#5C4A3A', 
            textAlign: 'center',
            lineHeight: 32,
          }}>
            {currentSunnah.hadith}
          </Text>
        </Card>

        {/* Actions */}
        <View className="mt-4">
          <Button 
            title="فعلتها اليوم" 
            onPress={markDoneToday} 
            color="#8FAF8B"
            colorEnd="#7A9E7F"
            textColor="#FFFFFF"
          />
          
          <Button 
            title="أفعلها بالفعل في حياتي" 
            onPress={markAlreadyDoing} 
            color="#C9956B"
            colorEnd="#B8845E"
            textColor="#FFFFFF"
          />
          
          <Button 
            title="تخطي" 
            onPress={skipSunnah} 
            variant="ghost"
            color="#C4A46C"
          />
        </View>
        
      </ScrollView>
    </PaperBackground>
  );
}
