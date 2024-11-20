import SafeAreaContent from "@/components/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";

export default function Home() {
  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2">
        <Text className="text-sm font-medium text-neutral-600 uppercase">
          Enaleia
        </Text>
        <View className="flex-row items-center justify-center gap-1 bg-green-50 rounded-full pb-1 px-2 border border-green-500">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs font-semibold text-neutral-600">Online</Text>
        </View>
      </View>
      <View className="flex-1 items-center justify-center bg-neutral-50 rounded-lg border-[1.5px] border-neutral-200">
        <Text className="font-medium">Active attestations</Text>
      </View>
      <View className="flex-row items-center justify-center w-full p-0 m-0 mt-2">
        <Pressable
          className="w-full bg-[#24548b] rounded-md flex flex-row items-center justify-center px-2 py-3"
          onPress={() => router.push("/forms/collection/new")}
        >
          <Ionicons name="add-circle" size={18} color="white" />
          <Text className="text-white font-semibold ml-1">
            Add new attestation
          </Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaContent>
  );
}
