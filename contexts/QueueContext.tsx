import { createContext, useContext, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus } from "@/types/queue";
import { processQueueItems } from "@/services/queueProcessor";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { getQueueCacheKey } from "@/utils/storage";
import { QueryClient } from "@tanstack/react-query";
import { useNetwork } from "./NetworkContext";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";

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
      await backgroundManager.processQueueItems();
    } finally {
      processingRef.current = false;
      console.log("Queue processing completed");
    }
  };

  // Network recovery handler
  useEffect(() => {
    console.log("Network state changed:", {
      isOnline,
      queueItemsCount: queueItems.length,
      processingRef: processingRef.current,
    });

    if (isOnline && queueItems.length > 0) {
      console.log("Network recovered, attempting to process queue");
      processQueue(queueItems).catch((err) =>
        console.error("Failed to process queue:", err)
      );
    } else if (!isOnline && queueItems.length > 0) {
      console.log("Network offline, marking items as offline");
      // Mark processing items as offline when network is lost
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
    }
  }, [isOnline]);

  const updateQueueItems = async (items: QueueItem[]): Promise<void> => {
    try {
      const key = getQueueCacheKey();
      await AsyncStorage.setItem(key, JSON.stringify(items));
      setQueueItems(items);

      // Force immediate processing regardless of network state
      console.log("Forcing immediate queue processing after update");
      const pendingItems = items.filter(
        (i) =>
          i.status === QueueItemStatus.PENDING ||
          i.status === QueueItemStatus.OFFLINE
      );

      if (pendingItems.length > 0) {
        await processQueueItems(pendingItems);
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
    const updatedItems = queueItems.map((item) => {
      if (items.some((i) => i.localId === item.localId)) {
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

    await updateQueueItems(updatedItems);
    // Trigger processing immediately after retry
    await backgroundManager.processQueueItems().catch((error) => {
      console.error("Failed to process retried items:", error);
    });
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
