import { View, Text, Image, Pressable, Linking, Alert } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Clipboard from "expo-clipboard";

const WalletScreen = () => {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [showCopied, setShowCopied] = useState(false);

  const userWalletAddress = user?.wallet_address;

  const copyAddress = async () => {
    if (userWalletAddress) {
      await Clipboard.setStringAsync(userWalletAddress);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } else {
        Alert.alert("Error", "No wallet address found to copy.");
    }
  };

  const handleOpenExplorer = async () => {
    if (!userWalletAddress) {
      Alert.alert("Error", "No wallet address available.");
      return;
    }
    const url = `https://optimistic.etherscan.io/address/${userWalletAddress}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open block explorer.");
      }
    } catch (error) {
      console.error("Failed to open block explorer:", error);
      Alert.alert("Error", "An error occurred while trying to open the block explorer.");
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
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4">
        Wallet address
      </Text>
      <View className="flex-1">
        <Text className="font-dm-regular text-base mb-4 leading-5">
         This wallet will be used to submit data to the Ethereum Attestation Service on Optimism, a layer-two blockchain.
        </Text>
        <View className="bg-sand-beige rounded-2xl p-4 mb-2">
          <Pressable
            onPress={copyAddress}
            className="flex-row items-center justify-between"
          >
            <Text className="font-dm-regular text-base flex-1 mr-2">
              {wallet?.address || "No wallet found"}
            </Text>
            <View className="w-8 h-8 items-center justify-top">
              {showCopied ? (
                <Ionicons name="checkmark" size={24} color="#667" />
              ) : (
                <Ionicons name="copy-outline" size={24} color="#667" />
              )}
            </View>
          </Pressable>
        </View>
        {userWalletAddress ? (
          <Pressable onPress={handleOpenExplorer} className="flex-row items-center gap-1 mt-1">
             <Text className="font-dm text-sm text-enaleia-blue">
               View this wallet on block explorer
             </Text>
             <Ionicons name="open-outline" size={14} color="#0D0D0D" />
          </Pressable>
        ) : (
          <Text className="font-dm text-sm text-grey-8 mt-1">
            No wallet address found to view on explorer.
          </Text>
        )}
      </View>
    </SafeAreaContent>
  );
};

export default WalletScreen;
