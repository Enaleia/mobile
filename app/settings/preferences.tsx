import { View, Text, Pressable, Switch } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePreferences } from "@/contexts/PreferencesContext";

const PreferencesScreen = () => {
  const { showAdvancedMode, toggleAdvancedMode } = usePreferences();

  return (
    <SafeAreaContent>
      <View className="flex-row items-center justify-start pb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
          <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
            Settings
          </Text>
        </Pressable>
      </View>
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-6">
        Preferences
      </Text>

      <View className="bg-white rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-dm-medium text-enaleia-black">
              Show advanced mode
            </Text>
            <Text className="text-sm font-dm-light text-grey-6">
              Display retry counts and countdown timers in queue
            </Text>
          </View>
          <Switch
            value={showAdvancedMode}
            onValueChange={toggleAdvancedMode}
            trackColor={{ false: "#D1D1D6", true: "#2985D0" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D1D6"
          />
        </View>
      </View>
    </SafeAreaContent>
  );
};

export default PreferencesScreen; 