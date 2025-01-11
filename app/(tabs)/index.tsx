import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { processActions } from "@/types/action";
import { BatchData } from "@/types/batch";
import { processCollectors } from "@/types/collector";
import { processMaterials } from "@/types/material";
import { processProducts } from "@/types/product";
import { batchFetchData } from "@/utils/batchFetcher";
import { Ionicons } from "@expo/vector-icons";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

function Home() {
  const { userData } = useUserInfo();
  const {
    data: batchData,
    error,
    isLoading,
  } = useQuery<BatchData, Error>({
    queryKey: ["batchData"],
    queryFn: async () => {
      try {
        const data = await batchFetchData();
        const processed = {
          actions: data.actions ? processActions(data.actions) : null,
          materials: data.materials ? processMaterials(data.materials) : null,
          collectors: data.collectors
            ? processCollectors(data.collectors)
            : null,
          products: data.products ? processProducts(data.products) : null,
        };

        if (
          !processed.actions ||
          !processed.materials ||
          !processed.collectors ||
          !processed.products
        ) {
          throw new Error("Missing required data");
        }

        return processed as BatchData;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const isComplete = userData && batchData;

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
          Hello, what action will you be doing today?
        </Text>
        <ActionSelection actions={batchData?.actions} isLoading={isLoading} />
      </View>
      <InitializationModal
        isVisible={!isComplete}
        progress={{
          user: Boolean(userData),
          actions: Boolean(batchData?.actions),
          materials: Boolean(batchData?.materials),
          collectors: Boolean(batchData?.collectors),
          products: Boolean(batchData?.products),
        }}
        error={error || null}
      />
    </SafeAreaContent>
  );
}

export default Home;
