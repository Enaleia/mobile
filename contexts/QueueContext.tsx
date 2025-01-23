import { createContext, useContext, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus } from "@/types/queue";
import { processQueueItems } from "@/services/queueProcessor";
import { useNetInfo } from "@react-native-community/netinfo";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { getCacheKey } from "@/utils/storage";

interface QueueContextType {
  queueItems: QueueItem[];
  loadQueueItems: () => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const { isConnected } = useNetInfo();
  const processingRef = useRef(false);

  const loadQueueItems = async () => {
    try {
      const key = getCacheKey();
      const data = await AsyncStorage.getItem(key);
      const items = data ? JSON.parse(data) : [];
      setQueueItems(items);
      return items;
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
      return [];
    }
  };

  const processQueue = async (items: QueueItem[]) => {
    if (processingRef.current) {
      console.log("Already processing queue, skipping");
      return;
    }

    const pendingItems = items.filter(
      (item) =>
        item.status === QueueItemStatus.PENDING ||
        (item.status === QueueItemStatus.FAILED &&
          item.retryCount < MAX_RETRIES)
    );

    console.log(
      "Found pending items:",
      pendingItems.length,
      "Processing state:",
      processingRef.current
    );

    if (pendingItems.length > 0 && isConnected) {
      processingRef.current = true;
      try {
        console.log(
          "Starting queue processing for items:",
          pendingItems.map((i) => i.localId)
        );
        await processQueueItems(pendingItems);
      } catch (error) {
        console.error("Error processing queue:", error);
      } finally {
        processingRef.current = false;
        await loadQueueItems(); // Refresh queue after processing
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadQueueItems().then((items) => {
      if (isConnected) {
        processQueue(items);
      }
    });
  }, []);

  // Process when connection changes
  useEffect(() => {
    if (isConnected && queueItems.length > 0) {
      processQueue(queueItems);
    }
  }, [isConnected]);

  const updateQueueItems = async (items: QueueItem[]) => {
    try {
      const key = getCacheKey();
      await AsyncStorage.setItem(key, JSON.stringify(items));
      setQueueItems(items);

      if (isConnected) {
        console.log("Triggering immediate queue processing after update");
        await processQueue(items);
      } else {
        console.log("Not connected, skipping immediate processing");
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

  // Add event listener for queue updates
  useEffect(() => {
    const handleQueueUpdate = () => {
      console.log("Queue update event received");
      loadQueueItems().then((items) => {
        if (isConnected) {
          processQueue(items);
        }
      });
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeAllListeners(QueueEvents.UPDATED);
    };
  }, [isConnected]);

  return (
    <QueueContext.Provider
      value={{ queueItems, loadQueueItems, updateQueueItems }}
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
