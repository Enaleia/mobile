import SafeAreaContent from "@/components/SafeAreaContent";
import { ACTIVITY_ICONS, ActivityTitle } from "@/constants/ActivityAssets";
import { ACTIVITY_TITLE_BY_URI, ActivityTitleURI } from "@/types/activity";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

const NewAttestForm = () => {
  const { type } = useLocalSearchParams();
  const activityTitle = ACTIVITY_TITLE_BY_URI[type as ActivityTitleURI];

  return (
    <SafeAreaContent>
      <View className="flex-1">
        <Link href="/attest/home" asChild>
          <Pressable className="flex-row items-center mb-4">
            <Ionicons name="chevron-back" size={24} color="#24548b" />
            <Text className="ml-1 text-[#24548b] font-dm-medium">
              Activities
            </Text>
          </Pressable>
        </Link>

        <View className="flex-row items-center mb-6">
          <View className="w-[56px] h-[56px] bg-blue-50 rounded-xl flex items-center justify-center mr-3 border border-blue-300">
            <Image
              source={ACTIVITY_ICONS[activityTitle as ActivityTitle]}
              className="w-[48px] h-[48px]"
            />
          </View>
          <Text className="text-2xl font-dm-medium text-neutral-800 tracking-[-0.5px]">
            {activityTitle}
          </Text>
        </View>

        {/* Form content will go here */}
      </View>
    </SafeAreaContent>
  );
};

export default NewAttestForm;
