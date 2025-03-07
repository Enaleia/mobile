import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "moti";
import SignOutModal from "@/components/features/auth/SignOutModal";
import { useAuth } from "@/contexts/AuthContext";
import NetworkStatus from "@/components/shared/NetworkStatus";
import { Company } from "@/types/company";

const SettingsScreen = () => {
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const { user } = useAuth();

  // Helper function to safely get company name
  const getCompanyName = () => {
    if (!user?.Company) return null;

    // If Company is an object with a name property
    if (typeof user.Company === "object" && "name" in user.Company) {
      return user.Company.name;
    }

    return null;
  };

  return (
    <SafeAreaContent>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="absolute bottom-20 right-[-10px] bg-white-sand">
          <Image
            source={require("@/assets/images/animals/Turtle.png")}
            className="w-[223px] h-[228px]"
            accessibilityLabel="Decorative turtle illustration"
            accessibilityRole="image"
          />
        </View>

        <View className="flex-row items-start justify-between pb-2 font-dm-regular">
          <View className="flex-row items-center justify-center gap-0.5">
            <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
            <Text className="text-sm font-bold text-enaleia-black">
              {user?.first_name || "User"}
            </Text>
          </View>
          <NetworkStatus />
        </View>

        <View className="mt-4">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Settings
          </Text>
        </View>

        <View className="mb-6 bg-white rounded-2xl shadow-sm">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-xl font-dm-bold text-gray-900">
              Profile
            </Text>
          </View>

          <View className="p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-lg font-dm-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </Text>
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-dm-medium text-gray-500">
                {user?.email}
              </Text>

              {getCompanyName() && (
                <Text className="text-sm font-dm-medium text-gray-500">
                  {getCompanyName()}
                </Text>
              )}
            </View>
          </View>
        </View>

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
      <SignOutModal
        isVisible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
      />
    </SafeAreaContent>
  );
};

export default SettingsScreen;
