import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useWallet } from "@/contexts/WalletContext";
import * as Clipboard from "expo-clipboard";

const WalletScreen = () => {
  const { wallet } = useWallet();
  const [showCopied, setShowCopied] = useState(false);

  const copyAddress = async () => {
    if (wallet?.address) {
      await Clipboard.setStringAsync(wallet.address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
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
          This is the blockchain wallet address this account will use to submit data to the Ethereum Attestation Services.
        </Text>
        <View className="bg-white rounded-2xl p-4 mb-2">
          <Pressable
            onPress={copyAddress}
            className="flex-row items-center justify-between"
          >
            <Text className="font-dm-regular text-base text-grey-6 flex-1 mr-2">
              {wallet?.address || "No wallet found"}
            </Text>
            <View className="w-8 h-8 items-center justify-center">
              {showCopied ? (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              ) : (
                <Ionicons name="copy-outline" size={20} color="#666" />
              )}
            </View>
          </Pressable>
        </View>
        <Text className="font-dm-light text-sm text-grey-6">
          Network: {wallet?.network || "Not connected"}
        </Text>
      </View>
    </SafeAreaContent>
  );
};

export default WalletScreen;
