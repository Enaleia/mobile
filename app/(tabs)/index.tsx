import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { groupActionsByCategory } from "@/types/action";
import { BatchData } from "@/types/batch";
import { Ionicons } from "@expo/vector-icons";
import { Text, View, Pressable, ScrollView, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { CollectionHelpModal } from '@/components/features/help/CollectionHelpModal';
import { UserProfile } from "@/components/shared/UserProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  initializeBatchData,
  subscribeToBatchData,
  clearBatchData,
  fetchAndProcessBatchData,
} from "@/utils/batchStorage";


function Home() {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = !!(isConnected && isInternetReachable);
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({
    user: false,
    actions: false,
    materials: false,
    collectors: false,
    products: false,
  });

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        const result = await initializeBatchData(isOnline, user);
        if (!mounted) return;

        setBatchData(result.data);
        setProgress(result.progress);
        setError(result.error);
      } catch (e) {
        if (!mounted) return;
        setError(e as Error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Subscribe to batch data updates
    const unsubscribe = subscribeToBatchData((data) => {
      if (mounted) {
        setBatchData(data);
        if (data) {
          setProgress({
            user: !!user,
            actions: !!data.actions?.length,
            materials: !!data.materials?.length,
            collectors: !!data.collectors?.length,
            products: !!data.products?.length,
          });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isOnline, user]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && user) {
      fetchAndProcessBatchData().catch(console.error);
    }
  }, [isOnline, user]);

  const isComplete = user && batchData;
  const isAuthError = !user || (error?.message || "").includes("FORBIDDEN");
  const groupedActions = batchData?.actions
    ? groupActionsByCategory(batchData.actions)
    : undefined;

  // Show initialization modal if loading or error
  const showInitModal =
    isLoading || (!isComplete && !isAuthError) || (!!error && !isAuthError);

  const handleClearCache = async () => {
    try {
      // Clear all storage
      await clearBatchData();
      await AsyncStorage.clear();

      // Force reload the app by navigating to login
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  };

  return (
    <SafeAreaContent>
      <InitializationModal
        isVisible={showInitModal}
        progress={progress}
        error={error instanceof Error ? error : null}
        isAuthError={isAuthError}
      />

      {/* Header - Fixed at top */}

      <View className="flex-row items-start justify-between pb-4">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {user?.first_name || "User"}
          </Text>
        </View>
        <Pressable
          onPress={handleClearCache}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="refresh-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-dm-regular text-enaleia-black">
            Clear Cache
          </Text>
        </Pressable>
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
            style={{ marginBottom: 12, lineHeight: 33 }}
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
