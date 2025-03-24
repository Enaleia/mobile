import { View, Text, Image, Pressable, Linking, Platform } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "moti";
import SignOutModal from "@/components/features/auth/SignOutModal";
import { useAuth } from "@/contexts/AuthContext";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import { Company } from "@/types/company";
import Constants from "expo-constants";
import { UserProfile } from "@/components/shared/UserProfile";

const SettingsScreen = () => {
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const { user, logout } = useAuth();

  const openGuides = async () => {
    const url = "https://sites.google.com/pollenlabs.org/enaleiahub-guides/mobile-app/mobile-app-overview";
    const canOpen = await Linking.canOpenURL(url);
  
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open guides at the moment.");
    }
  };

  const contactSupport = async () => {
    const email = "app-support@enaleia.com, enaleia@pollenlabs.org";
    const subject = encodeURIComponent("Support Request");
    const body = encodeURIComponent("Describe your issue here...");
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
  
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
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

  const version = Constants.expoConfig?.version ?? "0.0.0";
  const buildNumber = Platform.select({
    ios: Constants.expoConfig?.extra?.eas?.buildNumber ?? "1",
    android: Constants.expoConfig?.extra?.eas?.buildNumber ?? "1",
    default: "1",
  });

  return (
    <SafeAreaContent>
      <View>
        <UserProfile />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Settings
          </Text>
        </View>

        <View className="mb-4 rounded-2xl bg-white">
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
              Wallet address
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
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
          <Ionicons name="open-outline" size={16} color="#0D0D0D" />
        </Pressable>
        <Pressable
          onPress={contactSupport}
          className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="chatbox-ellipses-outline"
              size={24}
              color="#0D0D0D"
            />
            <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
              Contact support
            </Text>
          </View>
          <Ionicons name="mail-open-outline" size={16} color="#0D0D0D" />
        </Pressable>

        {__DEV__ && (
          <Pressable
            onPress={() => router.push("/settings/queue-test")}
            className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="bug-outline"
                size={24}
                color="#0D0D0D"
              />
              <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                Queue Testing
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
          </Pressable>
        )}

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
            Version {version} ({buildNumber})
          </Text>
        </View>

        <View className="mt-10 items-end opacity-100 left-[10px]">
          <Image
            source={require("@/assets/images/animals/TurtleCollab.png")}
            className="w-[390px] h-[198px]"
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
