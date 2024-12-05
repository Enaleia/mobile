import HomeActionSelection from "@/components/HomeActionSelection";
import SafeAreaContent from "@/components/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="location" size={16} color="#24548b" />
          <Text className="text-sm font-medium text-neutral-600">Skyplast</Text>
        </View>
        <View className="flex-row items-center justify-center space-x-2">
          <View className="flex-row items-center justify-center px-1.5 py-0.5 space-x-1 bg-green-50 rounded-full border border-green-400">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs font-semibold text-neutral-600">
              Online
            </Text>
          </View>
          <View className="flex-row items-center justify-center gap-1">
            <Ionicons name="notifications" size={18} color="#24548b" />
            <Ionicons name="settings" size={18} color="#24548b" />
          </View>
        </View>
      </View>
      <View className="flex-1 mt-4">
        <Text className="text-3xl font-dm-regular text-neutral-800 tracking-[-1px] mb-3">
          Choose an action below to record
        </Text>
        <HomeActionSelection />
      </View>
    </SafeAreaContent>
  );
}
