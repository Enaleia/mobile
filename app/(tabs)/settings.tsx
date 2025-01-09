import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "moti";
import SignOutModal from "@/components/features/auth/SignOutModal";

const SettingsScreen = () => {
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  return (
    <SafeAreaContent>
      <View className="absolute bottom-20 right-[-10px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[223px] h-[228px]"
          accessibilityLabel="Decorative turtle illustration"
          accessibilityRole="image"
        />
      </View>
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        Settings
      </Text>
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => router.push("/settings/wallet")}
            className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200 bg-white"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="wallet-outline" size={24} color="#0D0D0D" />
              <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                Wallet
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={16}
              color="#0D0D0D"
            />
          </Pressable>
          <Pressable
            onPress={() => setIsSignOutModalVisible(true)}
            className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200 bg-white"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={24} color="#0D0D0D" />
              <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                Sign Out
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
      <SignOutModal
        isVisible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
      />
    </SafeAreaContent>
  );
};

export default SettingsScreen;
