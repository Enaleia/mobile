import { createContext, useContext, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus } from "@/types/queue";
import { processQueueItems } from "@/services/queueProcessor";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { getQueueCacheKey } from "@/utils/storage";
import { QueryClient } from "@tanstack/react-query";
import { useNetwork } from "./NetworkContext";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { AppState } from "react-native";

interface QueueContextType {
  queueItems: QueueItem[];
  loadQueueItems: () => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
  clearStaleData: () => void;
  retryItems: (items: QueueItem[]) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const { isConnected, isInternetReachable, isMetered } = useNetwork();
  const processingRef = useRef(false);
  const queryClient = new QueryClient();
  const isOnline = isConnected && isInternetReachable;
  const backgroundManager = BackgroundTaskManager.getInstance();

  const loadQueueItems = async (): Promise<void> => {
    try {
      const key = getQueueCacheKey();
      const data = await AsyncStorage.getItem(key);
      const items: QueueItem[] = data ? JSON.parse(data) : [];

      // Filter out completed items older than 24 hours
      const now = Date.now();
      const incompleteItems = items.filter((item) => {
        if (item.status !== QueueItemStatus.COMPLETED) return true;
        const itemDate = new Date(item.lastAttempt || item.date).getTime();
        return now - itemDate < ONE_DAY;
      });

      // If we filtered out any items, update storage
      if (incompleteItems.length !== items.length) {
        await AsyncStorage.setItem(key, JSON.stringify(incompleteItems));
        console.log(
          `Cleaned up ${items.length - incompleteItems.length} completed items`
        );
      }

      setQueueItems(incompleteItems);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Cache key is not configured")
      ) {
        console.error("Queue functionality disabled:", error.message);
      } else {
        console.error("Error loading queue items:", error);
      }
      setQueueItems([]);
    }
  };

  const processQueue = async (items: QueueItem[]) => {
    console.log("Process queue called:", {
      isProcessing: processingRef.current,
      itemCount: items.length,
    });

    if (processingRef.current) {
      console.log("Already processing queue, skipping");
      return;
    }

    try {
      processingRef.current = true;
      // Use direct processing in foreground
      await processQueueItems(items);
    } finally {
      processingRef.current = false;
      console.log("Queue processing completed");
    }
  };

  // Add AppState listener for foreground/background detection
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came to foreground, process any pending items
        const pendingItems = queueItems.filter(
          (item) =>
            item.status === QueueItemStatus.PENDING ||
            item.status === QueueItemStatus.OFFLINE
        );
        if (pendingItems.length > 0 && isOnline) {
          console.log("App active, processing pending items in foreground");
          processQueue(pendingItems).catch((err) =>
            console.error("Failed to process queue in foreground:", err)
          );
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queueItems, isOnline]);

  const updateQueueItems = async (items: QueueItem[]): Promise<void> => {
    try {
      const key = getQueueCacheKey();
      await AsyncStorage.setItem(key, JSON.stringify(items));
      setQueueItems(items);

      const pendingItems = items.filter(
        (i) =>
          i.status === QueueItemStatus.PENDING ||
          i.status === QueueItemStatus.OFFLINE
      );

      if (pendingItems.length > 0) {
        const appState = AppState.currentState;
        console.log(
          "Processing items in",
          appState === "active" ? "foreground" : "background"
        );

        if (appState === "active") {
          // Process immediately in foreground
          await processQueue(pendingItems);
        } else {
          // Use background processing when app is not active
          await backgroundManager.processQueueItems();
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Cache key is not configured")
      ) {
        throw new Error("Unable to update queue: Cache key is not configured");
      }
      console.error("Error updating queue items:", error);
      throw error;
    }
  };

  const retryItems = async (items: QueueItem[]): Promise<void> => {
    console.log("Retrying items:", {
      itemsToRetry: items.length,
      itemIds: items.map((i) => i.localId),
    });

    try {
      const updatedItems = queueItems.map((item) => {
        if (items.some((i) => i.localId === item.localId)) {
          console.log(`Resetting item ${item.localId} to pending state`);
          return {
            ...item,
            status: QueueItemStatus.PENDING,
            retryCount: 0,
            lastError: undefined,
            lastAttempt: undefined,
          };
        }
        return item;
      });

      console.log("Updating queue with retried items");
      await updateQueueItems(updatedItems);

      // Force immediate processing
      console.log("Forcing immediate processing of retried items");
      const itemsToProcess = items.map((item) => ({
        ...item,
        status: QueueItemStatus.PENDING,
        retryCount: 0,
        lastError: undefined,
        lastAttempt: undefined,
      }));

      await processQueueItems(itemsToProcess).catch((error) => {
        console.error("Failed to process retried items:", error);
        // Update items to failed state if processing fails
        updateQueueItems(
          updatedItems.map((item) =>
            itemsToProcess.some((i) => i.localId === item.localId)
              ? {
                  ...item,
                  status: QueueItemStatus.FAILED,
                  lastError: error.message,
                }
              : item
          )
        );
      });
    } catch (error) {
      console.error("Error in retryItems:", error);
      throw error;
    }
  };

  useEffect(() => {
    const handleQueueUpdate = () => {
      console.log("Queue update event received");
      loadQueueItems().catch((error) => {
        console.error("Failed to load queue items after update:", error);
      });
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeAllListeners(QueueEvents.UPDATED);
    };
  }, [isOnline]);

  const clearStaleData = () => {
    queryClient.removeQueries({
      predicate: (query) => {
        const hour = 1000 * 60 * 60;
        return Date.now() - query.state.dataUpdatedAt > hour * 24;
      },
    });
  };

  // Network recovery handler
  useEffect(() => {
    console.log("Network state changed:", {
      isOnline,
      queueItemsCount: queueItems.length,
      processingRef: processingRef.current,
      appState: AppState.currentState,
    });

    if (!isOnline && queueItems.length > 0) {
      console.log("Network offline, marking items as offline");
      const updatedItems = queueItems.map((item) =>
        item.status === QueueItemStatus.PROCESSING
          ? { ...item, status: QueueItemStatus.OFFLINE }
          : item
      );
      if (JSON.stringify(updatedItems) !== JSON.stringify(queueItems)) {
        updateQueueItems(updatedItems).catch((error) => {
          console.error("Failed to update items on network loss:", error);
        });
      }
    } else if (
      isOnline &&
      queueItems.length > 0 &&
      AppState.currentState === "active"
    ) {
      // Only process in foreground when network recovers
      console.log("Network recovered, processing in foreground");
      const pendingItems = queueItems.filter(
        (item) =>
          item.status === QueueItemStatus.PENDING ||
          item.status === QueueItemStatus.OFFLINE
      );
      if (pendingItems.length > 0) {
        processQueue(pendingItems).catch((err) =>
          console.error("Failed to process queue on network recovery:", err)
        );
      }
    }
  }, [isOnline]);

  return (
    <QueueContext.Provider
      value={{
        queueItems,
        loadQueueItems,
        updateQueueItems,
        clearStaleData,
        retryItems,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};
