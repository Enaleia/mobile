import { View, Text, Switch, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { usePreferences } from "@/contexts/PreferencesContext";
import { router } from "expo-router";
import SafeAreaContent from "@/components/shared/SafeAreaContent";

const PreferencesScreen = () => {
  const { autoScanQR, autoJumpToWeight, setAutoScanQR, setAutoJumpToWeight } = usePreferences();

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
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        Preferences
      </Text>

      <View className="flex-1">
        <View className="space-y-2">
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-base font-dm-bold text-gray-900 mb-4">
              QR Scanner
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="qr-code-outline" size={24} color="#0D0D0D" />
                  <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                    Auto-scan QR code
                  </Text>
                </View>
                <Switch
                  value={autoScanQR}
                  onValueChange={setAutoScanQR}
                  trackColor={{ false: "#F3F4F6", true: "#F3F4F6" }}
                  thumbColor={autoScanQR ? "#2985D0" : "#2985D0"}
                />
              </View>
              <Text className="text-sm text-gray-500">
                Automatically open the QR scanner when adding a new material
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-base font-dm-bold text-gray-900 mb-4">
              Weight Field
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="scale-outline" size={24} color="#0D0D0D" />
                  <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                    Auto-jump to weight field
                  </Text>
                </View>
                <Switch
                  value={autoJumpToWeight}
                  onValueChange={setAutoJumpToWeight}
                  trackColor={{ false: "#F3F4F6", true: "#F3F4F6" }}
                  thumbColor={autoJumpToWeight ? "#2985D0" : "#2985D0"}
                />
              </View>
              <Text className="text-sm text-gray-500">
                Automatically focus the weight field after scanning a QR code
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaContent>
  );
};

export default PreferencesScreen; 