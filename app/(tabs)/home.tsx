import ActionSelection from "@/components/features/home/ActionSelect";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import useDirectus from "@/hooks/useDirectus";
import { readItems } from "@directus/sdk";
import { Ionicons } from "@expo/vector-icons";
import { Trans } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

export default function Home() {
  const { client } = useDirectus();
  const { data: actions } = useQuery({
    queryKey: ["actions"],
    queryFn: async () =>
      await client.request(
        readItems("Actions", {
          fields: ["*"],
        })
      ),
  });
  console.log({ actions });
  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            East Alexandria
          </Text>
        </View>
        <View className="flex-row items-center justify-center px-1.5 py-0.5 space-x-1 bg-sand-beige rounded-full">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs font-dm-medium text-enaleia-black">
            Online
          </Text>
        </View>
      </View>
      <View className="flex-1 mt-4">
        <Text className="text-3xl font-dm-bold tracking-[-1.5px] mb-2 text-enaleia-black">
          <Trans id="home.welcome_message">
            Hello, what action will you be doing today?
          </Trans>
        </Text>
        <ActionSelection />
      </View>
    </SafeAreaContent>
  );
}
