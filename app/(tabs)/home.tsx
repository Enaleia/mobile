import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useActions } from "@/hooks/data/useActions";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { Trans } from "@lingui/react";
import { onlineManager } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { useQueries } from "@tanstack/react-query";

function Home() {
  const { userData } = useUserInfo();
  const { actionsData } = useActions();
  const results = useQueries({
    queries: [
      { queryKey: ["materials"] },
      { queryKey: ["collectors"] },
      { queryKey: ["products"] },
    ],
  });

  const error = results.find((result) => result.error)?.error;
  const isComplete =
    userData && actionsData && results.every((result) => result.data);

  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {userData?.name}
          </Text>
        </View>
        <View className="flex-row items-center justify-center px-1.5 py-0.5 space-x-1 bg-sand-beige rounded-full">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs font-dm-medium text-enaleia-black">
            {onlineManager.isOnline() ? "Online" : "Offline"}
          </Text>
        </View>
      </View>
      <View className="flex-1 mt-4">
        <Text className="text-3xl font-dm-bold tracking-[-1.5px] mb-2 text-enaleia-black">
          <Trans id="home.welcome_message">
            Hello, what action will you be doing today?
          </Trans>
        </Text>
        <ActionSelection actions={actionsData} />
      </View>
      <InitializationModal
        isVisible={!isComplete}
        progress={{
          user: Boolean(userData),
          actions: Boolean(actionsData),
          materials: Boolean(results[0].data),
          collectors: Boolean(results[1].data),
          products: Boolean(results[2].data),
        }}
        error={error || null}
      />
    </SafeAreaContent>
  );
}

export default Home;
