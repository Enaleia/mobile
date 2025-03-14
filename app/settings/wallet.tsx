import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useWallet } from "@/contexts/WalletContext";
import * as Clipboard from "expo-clipboard";

const WalletScreen = () => {
  const { wallet } = useWallet();

  const copyAddress = () => {
    if (wallet?.address) {
      Clipboard.setStringAsync(wallet.address);
    }
  };

  return (
    <SafeAreaContent>
      <View className="absolute bottom-20 right-[10px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/JellyFish.png")}
          className="w-[223px] h-[228px]"
          accessibilityLabel="Decorative jellyfish illustration"
          accessibilityRole="image"
        />
      </View>
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
        Wallet address
      </Text>
      <View className="flex-1">
        <Text className="font-dm-medium text-base mb-2">
          Your wallet is connected to the following address:
        </Text>
        <Pressable
          onPress={copyAddress}
          className="flex-row items-center space-x-2"
        >
          <Text className="font-dm-regular text-base text-grey-6">
            {wallet?.address || "No wallet found"}
          </Text>
          <Ionicons name="copy-outline" size={20} color="#666" />
        </Pressable>
        <Text className="font-dm-light text-sm text-grey-6 mt-2">
          Network: {wallet?.network || "Not connected"}
        </Text>
      </View>
    </SafeAreaContent>
  );
};

export default WalletScreen;
