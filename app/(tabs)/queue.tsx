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

  const items = queueItems.length > 0 ? queueItems : [];

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

  useEffect(() => {
    const numPending = items.filter(
      (i) => i && i.status !== QueueItemStatus.COMPLETED
    ).length;

    navigation.setOptions({
      tabBarBadge: numPending > 0 ? numPending : undefined,
    });
  }, [items]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const handleRetry = async (items: QueueItem[]) => {
    const updatedItems = items.map((item) => ({
      ...item,
      status: QueueItemStatus.PENDING,
      retryCount: 0,
      lastError: undefined,
      lastAttempt: undefined,
    }));

    await AsyncStorage.setItem(
      process.env.EXPO_PUBLIC_CACHE_KEY || "",
      JSON.stringify(updatedItems)
    );

    try {
      await loadQueueItems();
    } catch (error) {
      console.error("Error retrying items:", error);
    }
  };

  // TODO: [DEV] This is a temporary fix to clear the cache when the queue is too large
  useEffect(() => {
    if (items?.length && items?.length > 30) {
      AsyncStorage.removeItem(process.env.EXPO_PUBLIC_CACHE_KEY || "")
        .then(() => {
          loadQueueItems();
        })
        .catch((error) => {
          console.error("Error clearing queue cache:", error);
        });
    }
  }, [items?.length]);

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
