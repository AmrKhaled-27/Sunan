import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSunnah } from '@/hooks/SunnahContext';
import { Card } from '@/components/Card';
import { PaperBackground } from '@/components/PaperBackground';

export default function AccomplishedScreen() {
  const insets = useSafeAreaInsets();
  const { accomplishedSunnahs } = useSunnah();

  return (
    <PaperBackground>
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>

        {/* Page Title */}
        <Text style={{ 
          fontFamily: 'Amiri_700Bold', 
          fontSize: 26, 
          color: '#3D2E1F',
          textAlign: 'center',
          marginBottom: 16,
          paddingHorizontal: 20,
        }}>
          السنن المنجزة
        </Text>

        {accomplishedSunnahs.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Text style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>
              ☾
            </Text>
            <Text style={{ 
              fontFamily: 'Amiri_700Bold', 
              fontSize: 22, 
              color: '#3D2E1F',
              textAlign: 'center',
            }}>
              لم تنجز أي سنن بعد.
            </Text>
            <Text style={{ 
              fontFamily: 'Amiri_400Regular', 
              fontSize: 17, 
              color: '#5C4A3A',
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 28,
            }}>
              ابدأ بتطبيق السنن اليومية لتراها هنا.
            </Text>
          </View>
        ) : (
          <FlatList
            data={accomplishedSunnahs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 90,
              paddingTop: 8,
            }}
            renderItem={({ item }) => (
              <Card color="#FAF7F0">
                <Text style={{ 
                  fontFamily: 'Amiri_700Bold', 
                  fontSize: 22, 
                  color: '#3D2E1F',
                  marginBottom: 8,
                }}>
                  {item.action}
                </Text>

                {/* Decorative divider */}
                <View className="flex-row items-center mb-3">
                  <View style={{ width: 40, height: 0.5, backgroundColor: 'rgba(196,164,108,0.4)' }} />
                  <Text style={{ marginHorizontal: 8, color: '#C4A46C', fontSize: 10 }}>✦</Text>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(196,164,108,0.2)' }} />
                </View>

                <Text style={{ 
                  fontFamily: 'Amiri_400Regular', 
                  fontSize: 16, 
                  color: '#5C4A3A',
                  lineHeight: 28,
                }}>
                  {item.hadith}
                </Text>
              </Card>
            )}
          />
        )}
      </View>
    </PaperBackground>
  );
}
