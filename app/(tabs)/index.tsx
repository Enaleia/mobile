import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { groupActionsByCategory, processActions } from "@/types/action";
import { BatchData } from "@/types/batch";
import { processCollectors } from "@/types/collector";
import { processMaterials } from "@/types/material";
import { processProducts } from "@/types/product";
import { batchFetchData } from "@/utils/batchFetcher";
import { Ionicons } from "@expo/vector-icons";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View, Pressable, ScrollView } from "react-native";
import React, { useEffect } from "react";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";
import { useNetwork } from "@/contexts/NetworkContext";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";

function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  const {
    data: batchData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["batchData"],
    queryFn: async () => {
      if (!isOnline) {
        console.log("Offline, using cached data");
        const cachedData = queryClient.getQueryData<BatchData>(["batchData"]);
        if (!cachedData) {
          console.log("No cached data available");
        }
        return cachedData;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        const data = await batchFetchData();
        if (!data) {
          throw new Error("Failed to fetch batch data");
        }

        // Process the data
        const processedData: BatchData = {
          collectors: processCollectors(data.collectors as DirectusCollector[]),
          materials: processMaterials(data.materials),
          products: processProducts(data.products as DirectusProduct[]),
          actions: processActions(data.actions),
        };

        return processedData;
      } catch (error) {
        console.error("Error fetching batch data:", error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });

  useEffect(() => {
    if (isOnline && user) {
      refetch();
    }
  }, [isOnline, user]);

  const isComplete = user && batchData;
  const isAuthError = !user || (error?.message || "").includes("FORBIDDEN");
  const groupedActions = batchData?.actions
    ? groupActionsByCategory(batchData.actions)
    : undefined;

  // Track initialization progress
  const progress = {
    user: !!user,
    actions: !!batchData?.actions,
    materials: !!batchData?.materials,
    collectors: !!batchData?.collectors,
    products: !!batchData?.products,
  };

  // Show initialization modal if loading or error
  const showInitModal =
    isLoading || (!isComplete && !isAuthError) || (!!error && !isAuthError);

  return (
    <SafeAreaContent>
      <InitializationModal
        isVisible={showInitModal}
        progress={progress}
        error={error instanceof Error ? error : null}
        isAuthError={isAuthError}
      />

      {/* Header - Fixed at top */}
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {user?.first_name || "User"}
          </Text>
        </View>
        {/* <NetworkStatus /> */}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="mt-4">
          <Text
            className="text-[33px] font-dm-bold tracking-[-1.5px] text-enaleia-black pt-1"
            style={{ marginBottom: 0, lineHeight: 33 }}
          >
            Hello, what action will you be doing today?
          </Text>
          <ActionSelection
            actions={groupedActions ?? undefined}
            isLoading={isLoading && !isAuthError}
          />
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
}

export default Home;
