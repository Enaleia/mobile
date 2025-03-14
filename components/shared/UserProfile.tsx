import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export const UserProfile = () => {
  const { user } = useAuth();

  const handlePress = () => {
    router.push('/settings');
  };

  return (
    <Pressable onPress={handlePress} className="flex-row items-start justify-between pb-2 font-dm-regular">
      <View className="flex-row items-center justify-center gap-0.5">
        <Ionicons name="person-circle-outline" size={32} color="#0D0D0D" />
        <Text className="text-lg font-bold text-enaleia-black">
          {user?.first_name || "User"}
        </Text>
      </View>
    </Pressable>
  );
}; 