import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { processQueueItems } from "@/services/queueProcessor";
import { useNetInfo } from "@react-native-community/netinfo";

interface QueueContextType {
  queueItems: QueueItem[];
  loadQueueItems: () => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const { isConnected } = useNetInfo();

  const loadQueueItems = async () => {
    try {
      const data = await AsyncStorage.getItem(
        process.env.EXPO_PUBLIC_CACHE_KEY || ""
      );
      if (!data) return;
      setQueueItems(JSON.parse(data));
    } catch (error) {
      console.error("Error loading queue items:", error);
    }
  };

  const updateQueueItems = async (items: QueueItem[]) => {
    try {
      await AsyncStorage.setItem(
        process.env.EXPO_PUBLIC_CACHE_KEY || "",
        JSON.stringify(items)
      );
      setQueueItems(items);
    } catch (error) {
      console.error("Error updating queue items:", error);
    }
  };

  useEffect(() => {
    loadQueueItems();
  }, []);

  // Process queue items when they're added and we're online
  useEffect(() => {
    if (queueItems.length > 0 && isConnected) {
      const pendingItems = queueItems.filter(
        (item) =>
          item.status === QueueItemStatus.PENDING ||
          item.status === QueueItemStatus.FAILED
      );
      if (pendingItems.length > 0) {
        processQueueItems(pendingItems);
      }
    }
  }, [queueItems, isConnected]);

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
