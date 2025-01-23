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
  } = useQuery<BatchData | null, Error>({
    queryKey: ["batchData"],
    queryFn: async () => {
      try {
        const data = await batchFetchData();
        if (
          !data.actions.length &&
          !data.materials.length &&
          !data.collectors.length &&
          !data.products.length
        ) {
          return null;
        }

        const actions = processActions(data.actions);
        const materials = processMaterials(data.materials);
        const collectors = processCollectors(data.collectors);
        const products = processProducts(data.products);

        if (!actions || !materials || !collectors || !products) {
          throw new Error("Missing required data");
        }

        return { actions, materials, collectors, products };
      } catch (error: any) {
        if (!error?.message?.includes("FORBIDDEN")) {
          throw error;
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!userData, // Only fetch when we have user data
  });

  const isComplete = userData && batchData;
  const isAuthError = !userData || (error?.message || "").includes("FORBIDDEN");

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
        <ActionSelection
          actions={batchData?.actions ?? undefined}
          isLoading={isLoading && !isAuthError}
        />
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
        error={error}
        isAuthError={isAuthError}
      />
    </SafeAreaContent>
  );
}

export default Home;
