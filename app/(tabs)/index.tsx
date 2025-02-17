import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { groupActionsByCategory, processActions } from "@/types/action";
import { BatchData } from "@/types/batch";
import { processCollectors } from "@/types/collector";
import { processMaterials } from "@/types/material";
import { processProducts } from "@/types/product";
import { batchFetchData } from "@/utils/batchFetcher";
import { Ionicons } from "@expo/vector-icons";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View, Pressable } from "react-native";
import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";
import { EnaleiaUser } from "@/types/user";
import { useNetwork } from "@/contexts/NetworkContext";
import NetworkStatus from "@/components/shared/NetworkStatus";

function Home() {
  const { userData } = useUserInfo();
  const queryClient = useQueryClient();
  const { isConnected, isInternetReachable, connectionType } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem("userInfo");
        if (storedUserInfo) {
          const userInfo = JSON.parse(storedUserInfo);
          await queryClient.setQueryData<EnaleiaUser>(["user-info"], userInfo);
        }
      } catch (error) {
        console.error("Error initializing user data:", error);
      }
    };

    initializeUserData();
  }, []);

  useEffect(() => {
    const debugStorage = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      console.log("Stored User Info:", userInfo);
    };
    debugStorage();
  }, []);

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
        const collectors = data.collectors as DirectusCollector[];
        const products = data.products as DirectusProduct[];

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
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!userData,
  });

  const isComplete = userData && batchData;
  const isAuthError = !userData || (error?.message || "").includes("FORBIDDEN");
  const groupedActions = batchData?.actions
    ? groupActionsByCategory(batchData.actions)
    : undefined;

  return (
    <SafeAreaContent>
      {__DEV__ && (
        <View>
          <Pressable
            onPress={async () => {
              const userInfo = await AsyncStorage.getItem("userInfo");
              console.log("Stored User Info:", userInfo);
            }}
            className="p-3 my-1 bg-blue-500 rounded"
          >
            <Text className="text-white text-center">Debug: Show Storage</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              await AsyncStorage.clear();
              await queryClient.invalidateQueries({ queryKey: ["user-info"] });
              await queryClient.resetQueries({ queryKey: ["user-info"] });
              console.log("Storage cleared and queries invalidated");
            }}
            className="p-3 my-1 bg-red-500 rounded"
          >
            <Text className="text-white text-center">Debug: Clear Storage</Text>
          </Pressable>
        </View>
      )}
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {userData?.first_name || "User"}
          </Text>
        </View>
        <NetworkStatus />
      </View>
      <View className="flex-1 mt-4">
        <Text className="text-3xl font-dm-bold tracking-[-1.5px] mb-2 text-enaleia-black">
          Hello, what action will you be doing today?
        </Text>
        <ActionSelection
          actions={groupedActions ?? undefined}
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
