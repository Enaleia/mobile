import { View, Text, Image, Pressable, Linking } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "moti";
import SignOutModal from "@/components/features/auth/SignOutModal";
import { useAuth } from "@/contexts/AuthContext";
import NetworkStatus from "@/components/shared/NetworkStatus";
import { Company } from "@/types/company";
import Constants from "expo-constants";

const SettingsScreen = () => {
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const { user } = useAuth();

  const openGuides = async () => {
    const url = "https://sites.google.com/pollenlabs.org/enaleiahub-guides/mobile-app/mobile-app-overview";
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

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

        <View className="mb-6 rounded-2xl border border-gray-400 ">
          <View className="p-4">
          <View className="pb-4">
              <Text className="text-base font-dm-bold text-gray-900">
                Account information
              </Text>
            </View>
            {/* <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="id-card-outline" size={24} color="#0D0D0D" />
              <Text className="text-lg font-dm-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </Text>
            </View> */}

            <View className="space-y-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="mail-outline" size={24} color="#0D0D0D" />
                <Text className="text-base font-dm-medium text-gray-900">
                  {user?.email}
                </Text>
              </View>

              {getCompanyName() && (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="business-outline" size={24} color="#0D0D0D" />
                  <Text className="text-base font-dm-medium text-gray-900">
                    {getCompanyName()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/settings/wallet")}
          className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white rounded-t-2xl"
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
          onPress={openGuides}
          className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="book-outline" size={24} color="#0D0D0D" />
            <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
              Guides
            </Text>
          </View>
          <Ionicons
            name="open-outline"
            size={16}
            color="#0D0D0D"
          />
        </Pressable>
        <Pressable
          onPress={() => setIsSignOutModalVisible(true)}
          className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white rounded-b-2xl"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={24} color="#0D0D0D" />
            <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
              Sign Out
            </Text>
          </View>
        </Pressable>
        
        <View className="items-center mt-4">
          <Text className="text-sm font-dm-regular text-gray-500">
            Version {Constants.expoConfig?.version} ({Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode})
          </Text>
        </View>

        <View className="mt-20 items-end opacity-60">
          <Image
            source={require("@/assets/images/animals/Turtle.png")}
            className="w-[280px] h-[280px]"
            accessibilityLabel="Decorative turtle illustration"
            accessibilityRole="image"
          />
        </View>

        
      </ScrollView>
      <SignOutModal
        isVisible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
      />
    </SafeAreaContent>
  );
};

export default SettingsScreen;
