import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const WalletScreen = () => {
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
           <Ionicons
                name="chevron-back"
                size={24}
                color="#0D0D0D"
              />
          <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
            Settings
          </Text>
        </Pressable>
      </View>
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        Wallet address
      </Text>
      <View className="flex-1 mt-4 text-base">
        <Text className="mb-4">This is a blockchain wallet which the application will be use to submit data onto blockchain.</Text>
        <Text>0x1234567890</Text>
      </View>
    </SafeAreaContent>
  );
};

export default WalletScreen;
