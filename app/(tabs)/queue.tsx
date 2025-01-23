import QueueSection from "@/components/features/queue/QueueSection";
import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

const QueueScreen = () => {
  const { queueItems, loadQueueItems } = useQueue();
  const navigation = useNavigation();
  const { isConnected } = useNetInfo();

  // Initialize arrays with proper null checks
  const items = queueItems.length > 0 ? queueItems : [];

  // Ensure we're working with arrays and handle null/undefined
  const pendingItems = items.filter(
    (i) => i && i.status === QueueItemStatus.PENDING
  );

  const processingItems = items.filter(
    (i) => i && i.status === QueueItemStatus.PROCESSING
  );

  const failedItems = items.filter(
    (i) => i && i.status === QueueItemStatus.FAILED
  );

  const offlineItems = items.filter(
    (i) => i && i.status === QueueItemStatus.OFFLINE
  );

  const completedItems = items.filter(
    (i) => i && i.status === QueueItemStatus.COMPLETED
  );

  // Update badge count
  useEffect(() => {
    const numPending = items.filter(
      (i) => i && i.status !== QueueItemStatus.COMPLETED
    ).length;

    navigation.setOptions({
      tabBarBadge: numPending > 0 ? numPending : undefined,
    });
  }, [items]);

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  // Listen for queue updates
  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const handleRetry = async (items: QueueItem[]) => {
    // Reset items to pending state and clear retry count
    const updatedItems = items.map((item) => ({
      ...item,
      status: QueueItemStatus.PENDING,
      retryCount: 0,
      lastError: undefined,
      lastAttempt: undefined,
    }));

    // Update items in AsyncStorage
    await AsyncStorage.setItem(
      process.env.EXPO_PUBLIC_CACHE_KEY || "",
      JSON.stringify(updatedItems)
    );

    try {
      // Just trigger a queue items refresh - the queue processor will handle the rest
      await loadQueueItems();
    } catch (error) {
      console.error("Error retrying items:", error);
    }
  };

  // TODO: [DEV] This is a temporary fix to clear the cache when the queue is too large
  useEffect(() => {
    // If there are more than 30 queued actions, invalidate and clear the cache
    if (items?.length && items?.length > 30) {
      // Clear the AsyncStorage cache using the environment variable
      AsyncStorage.removeItem(process.env.EXPO_PUBLIC_CACHE_KEY || "")
        .then(() => {
          // Invalidate and reset the query client
          loadQueueItems();
        })
        .catch((error) => {
          console.error("Error clearing queue cache:", error);
        });
    }
  }, [items?.length]);

  useEffect(() => {
    console.log("Queue Items:", items);
    console.log("Pending:", pendingItems);
    console.log("Processing:", processingItems);
    console.log("Failed:", failedItems);
    console.log("Offline:", offlineItems);
    console.log("Completed:", completedItems);
  }, [items]);

  const hasNoItems =
    !pendingItems.length &&
    !processingItems.length &&
    !failedItems.length &&
    !offlineItems.length;

  return (
    <SafeAreaContent>
      <NetworkStatus isConnected={isConnected || false} />

      {hasNoItems ? (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
          <Text className="text-lg text-center mt-4 font-medium">
            Queue is Empty
          </Text>
          <Text className="text-sm text-center text-gray-600 mt-2">
            All actions have been processed successfully. Create a new action to
            see it here.
          </Text>
        </View>
      ) : (
        <>
          {pendingItems.length > 0 && (
            <QueueSection
              title="Pending"
              items={pendingItems}
              onRetry={handleRetry}
            />
          )}

          {processingItems.length > 0 && (
            <QueueSection
              title="Processing"
              items={processingItems}
              onRetry={handleRetry}
            />
          )}

          {failedItems.length > 0 && (
            <QueueSection
              title="Failed"
              items={failedItems}
              onRetry={handleRetry}
            />
          )}

          {offlineItems.length > 0 && (
            <QueueSection
              title="Offline"
              items={offlineItems}
              onRetry={handleRetry}
            />
          )}

          {/* Development only section */}
          {process.env.NODE_ENV === "development" &&
            completedItems &&
            completedItems.length > 0 && (
              <QueueSection
                title="Completed (Dev Only)"
                items={completedItems}
                onRetry={handleRetry}
              />
            )}
        </>
      )}
    </SafeAreaContent>
  );
};

export default QueueScreen;
