import { IEvent } from "@/api/events/new";
import QueueSection from "@/components/features/queue/QueueSection";
import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { processQueueItems } from "@/services/queueProcessor";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useQueue } from "@/contexts/QueueContext";
import { queueEventEmitter, QueueEvents } from "@/services/events";
import { useEventListener } from "expo";

const QueueScreen = () => {
  const { queueItems, loadQueueItems } = useQueue();
  const navigation = useNavigation();
  const { isConnected } = useNetInfo();

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  // Listen for queue updates
  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const pendingItems = queueItems.filter(
    (i) => i.status === QueueItemStatus.PENDING
  );
  const processingItems = queueItems.filter(
    (i) => i.status === QueueItemStatus.PROCESSING
  );
  const failedItems = queueItems.filter(
    (i) => i.status === QueueItemStatus.FAILED
  );
  const offlineItems = queueItems.filter(
    (i) => i.status === QueueItemStatus.OFFLINE
  );
  const completedItems = queueItems.filter(
    (i) => i.status === QueueItemStatus.COMPLETED
  );

  const handleRetry = async (items: QueueItem[]) => {
    try {
      await processQueueItems(items);
      await loadQueueItems(); // Refresh after retry
    } catch (error) {
      console.error("Error retrying items:", error);
    }
  };

  useEffect(() => {
    const numPending = queueItems?.filter(
      (i) => i.status !== QueueItemStatus.COMPLETED
    )?.length;
    // Update the tab bar badge with number of incomplete actions
    navigation.setOptions({
      tabBarBadge: numPending > 0 ? numPending : undefined,
    });
  }, [queueItems]);

  // TODO: [DEV] This is a temporary fix to clear the cache when the queue is too large
  useEffect(() => {
    // If there are more than 30 queued actions, invalidate and clear the cache
    if (queueItems?.length && queueItems?.length > 30) {
      // Clear the AsyncStorage cache
      AsyncStorage.removeItem("enaleia-cache-v0")
        .then(() => {
          // Invalidate and reset the query client
          loadQueueItems();
        })
        .catch((error) => {
          console.error("Error clearing queue cache:", error);
        });
    }
  }, [queueItems?.length]);

  useEffect(() => {
    console.log("Queue Items:", queueItems);
    console.log("Pending:", pendingItems);
    console.log("Processing:", processingItems);
    console.log("Failed:", failedItems);
    console.log("Offline:", offlineItems);
    console.log("Completed:", completedItems);
  }, [queueItems]);

  return (
    <SafeAreaContent>
      <NetworkStatus isConnected={isConnected || false} />

      {pendingItems && pendingItems?.length > 0 && (
        <QueueSection
          title="Pending"
          items={pendingItems}
          onRetry={handleRetry}
        />
      )}

      {processingItems && processingItems?.length > 0 && (
        <QueueSection
          title="Processing"
          items={processingItems}
          onRetry={handleRetry}
        />
      )}

      {failedItems && failedItems?.length > 0 && (
        <QueueSection
          title="Failed"
          items={failedItems}
          onRetry={handleRetry}
        />
      )}

      {offlineItems && offlineItems?.length > 0 && (
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
    </SafeAreaContent>
  );
};

export default QueueScreen;
