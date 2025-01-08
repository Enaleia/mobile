import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useActions } from "@/hooks/useActions";
import { useInitialData } from "@/hooks/useInitialData";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { Trans } from "@lingui/react";
import { onlineManager } from "@tanstack/react-query";
import { Text, View } from "react-native";

function Home() {
  const { isLoading, error, progress, isComplete } = useInitialData();
  const { userData } = useUserInfo();
  const { actionsData } = useActions();

  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {userData.name}
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
        <ActionSelection actions={actionsData} isLoading={isLoading} />
      </View>
      <InitializationModal
        isVisible={!isComplete}
        progress={progress}
        error={error}
      />
    </SafeAreaContent>
  );
}

export default Home;
