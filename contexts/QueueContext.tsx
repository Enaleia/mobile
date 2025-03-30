import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus, ServiceStatus, getOverallStatus, shouldProcessItem, determineItemStatus } from "@/types/queue";
import { processQueueItems as processQueueItemsService } from "@/services/queueProcessor";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { useNetwork } from "./NetworkContext";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { directus } from "@/utils/directus";
import {
  getActiveQueue,
  getCompletedQueue,
  updateActiveQueue,
  addToCompletedQueue,
  cleanupExpiredItems,
  removeFromActiveQueue,
  CompletedQueueItem,
} from "@/utils/queueStorage";
import { useWallet } from "@/contexts/WalletContext";
import { getBatchData } from "@/utils/batchStorage";
import { getEvent } from "@/services/directus";
import NetInfo from "@react-native-community/netinfo";
import { updateItemInCache } from "@/services/queueProcessor";
import { QueueDebugMonitor } from "@/services/queueDebugMonitor";

const queueDebugMonitor = QueueDebugMonitor.getInstance();

export interface QueueContextType {
  queueItems: QueueItem[];
  completedCount: number;
  loadQueueItems: () => Promise<void>;
  updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
  retryItem: (itemId: string) => Promise<void>;
  retryItems: (items: QueueItem[]) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  processQueueItems: (items?: QueueItem[]) => Promise<void>;
  isProcessing: boolean;
  refreshQueueStatus: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const COMPLETED_COUNT_KEY = "@queue/completed_count";

interface RetryResult {
  success: boolean;
  localId: string;
  error?: string;
}

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const network = useNetwork();
  const isOnline = network.isConnected && network.isInternetReachable;
  const { wallet } = useWallet();

  // Load queue items
  const loadQueueItems = useCallback(async () => {
    try {
      const [active, completed] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue()
      ]);

      // Clean up expired items
      const now = Date.now();
      const cleanedActive = active.filter(item => {
        const itemDate = new Date(item.date).getTime();
        return now - itemDate < 24 * 60 * 60 * 1000; // 24 hours
      });

      // Ensure unique items by localId
      const uniqueActive = cleanedActive.reduce((acc, item) => {
        if (!acc.find(i => i.localId === item.localId)) {
          acc.push(item);
        }
        return acc;
      }, [] as QueueItem[]);

      setQueueItems(uniqueActive);
      setCompletedCount(completed.length);
    } catch (error) {
      console.error("Error loading queue items:", error);
    }
  }, []);

  // Initialize queue state
  const initializeQueue = useCallback(async () => {
    try {
      queueDebugMonitor.logQueueMetrics([]);  // Initialize metrics
      queueDebugMonitor.logNetworkStatus(
        network.isConnected ?? false,
        network.isInternetReachable ?? false
      );
      
      const activeQueue = await getActiveQueue();
      
      // Check for any items in PROCESSING state at launch
      const processingItems = activeQueue.filter(item => item.status === QueueItemStatus.PROCESSING);
      
      if (processingItems.length > 0) {
        queueDebugMonitor.logQueueMetrics(processingItems);
        
        for (const item of processingItems) {
          const hasIncompleteServices = 
            item.directus?.status !== ServiceStatus.COMPLETED ||
            item.eas?.status !== ServiceStatus.COMPLETED ||
            item.linking?.status !== ServiceStatus.COMPLETED;

          if (hasIncompleteServices) {
            queueDebugMonitor.logStuckItem(item);
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.PENDING,
              lastError: "Reset at launch - incomplete services",
              lastAttempt: undefined,
              // Reset service states while preserving completed ones
              directus: item.directus?.status === ServiceStatus.COMPLETED ? 
                item.directus : 
                { ...item.directus, status: ServiceStatus.INCOMPLETE, error: undefined },
              eas: item.eas?.status === ServiceStatus.COMPLETED ? 
                item.eas : 
                { ...item.eas, status: ServiceStatus.INCOMPLETE, error: undefined },
              linking: item.linking?.status === ServiceStatus.COMPLETED ? 
                item.linking : 
                { ...item.linking, status: ServiceStatus.INCOMPLETE, error: undefined }
            });
            queueDebugMonitor.logItemStateChange(item, { status: QueueItemStatus.PENDING });
            } else {
            queueDebugMonitor.logProcessingComplete(item, true);
          }
        }
      }

      // Load the queue after initialization
      await loadQueueItems();
      setIsInitialized(true);
      queueDebugMonitor.logQueueMetrics(await getActiveQueue());
    } catch (error) {
      if (error instanceof Error) {
        queueDebugMonitor.logProcessingComplete({ localId: 'init' } as QueueItem, false, error.message);
      }
      // Still mark as initialized to prevent infinite retries
      setIsInitialized(true);
    }
  }, [loadQueueItems, isOnline, network.isInternetReachable]);

  // Run initialization at app launch
  useEffect(() => {
    initializeQueue();
  }, [initializeQueue]);

  // Process queue items
  const processQueueItems = useCallback(async (itemsToProcess?: QueueItem[]) => {
    if (!isOnline || isProcessing) return;

    try {
      setIsProcessing(true);

      // Get items to process
      const items = itemsToProcess || queueItems;
      const itemsNeedingProcessing = items.filter(shouldProcessItem);

      if (!itemsNeedingProcessing.length) {
        return;
      }

      // Process items sequentially
      for (const item of itemsNeedingProcessing) {
        try {
          // Set item to processing state
          await updateQueueItem(item.localId, {
            status: QueueItemStatus.PROCESSING,
            lastAttempt: new Date().toISOString()
          });

          // Process the item
          await processQueueItemsService([item], wallet);

          // Reload queue items to get updated state
          await loadQueueItems();
        } catch (error) {
          console.error(`Error processing item ${item.localId}:`, error);
          // Continue with next item even if this one fails
          continue;
        }
      }

      // Set last batch attempt time after all items have finished processing
      await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());
    } catch (error) {
      console.error("Error processing queue items:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, isProcessing, queueItems, wallet, loadQueueItems]);

  // Update queue item
  const updateQueueItem = useCallback(async (itemId: string, updates: Partial<QueueItem>) => {
    try {
      await updateItemInCache(itemId, updates);
      // Force a queue refresh to update UI
      queueEventEmitter.emit(QueueEvents.UPDATED);
      await loadQueueItems();
          } catch (error) {
      console.error("Error updating queue item:", error);
    }
  }, [loadQueueItems]);

  // Add batch update function
  const updateQueueItems = useCallback(async (items: QueueItem[]) => {
    if (!items.length) return;

    try {
      // Get existing items
      const existingItems = await getActiveQueue();
      
      // Update or add each item
      for (const item of items) {
        const existingItem = existingItems.find(i => i.localId === item.localId);
        if (existingItem) {
          // Update existing item
          await updateQueueItem(item.localId, item);
        } else {
          // Add new item to the beginning of the queue (most recent first)
          const updatedItems = [item, ...existingItems];
          // Sort by date, most recent first
          updatedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          await updateActiveQueue(updatedItems);
        }
      }

      // Reload queue items to get updated state
      await loadQueueItems();

      // If no items are currently processing, process new items
      if (isOnline && !isProcessing) {
        await processQueueItems(items);
      }
    } catch (error) {
      console.error("Error updating queue items:", error);
      throw error;
    }
  }, [isOnline, isProcessing, updateQueueItem, loadQueueItems, processQueueItems]);

  // Retry item
  const retryItem = useCallback(async (itemId: string) => {
    const item = queueItems.find(i => i.localId === itemId);
    if (!item) return;

    try {
      await updateQueueItem(itemId, {
            status: QueueItemStatus.PENDING,
            lastError: undefined,
            lastAttempt: undefined,
        // Only reset incomplete services
        directus: item.directus?.status === ServiceStatus.INCOMPLETE ? {
          ...item.directus,
          error: undefined
        } : item.directus,
        eas: item.eas?.status === ServiceStatus.INCOMPLETE ? {
          ...item.eas,
          error: undefined
        } : item.eas,
        linking: item.linking?.status === ServiceStatus.INCOMPLETE ? {
          ...item.linking,
          error: undefined
        } : item.linking
      });
        } catch (error) {
      console.error("Error retrying item:", error);
    }
  }, [queueItems, updateQueueItem]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await updateQueueItem(itemId, { deleted: true });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }, [updateQueueItem]);

  // Listen for queue updates
  useEffect(() => {
    const handleQueueUpdate = () => {
      loadQueueItems();
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeListener(QueueEvents.UPDATED, handleQueueUpdate);
    };
  }, [loadQueueItems]);

  // Initial load
  useEffect(() => {
    loadQueueItems();
  }, [loadQueueItems]);

  // Retry multiple items
  const retryItems = useCallback(async (items: QueueItem[]) => {
    try {
      // Process the items directly without resetting their status
      await processQueueItems(items);
    } catch (error) {
      console.error("Error retrying items:", error);
    }
  }, [processQueueItems]);

  // Refresh queue status
  const refreshQueueStatus = useCallback(async () => {
    try {
      await loadQueueItems();
    } catch (error) {
      console.error("Error refreshing queue status:", error);
    }
  }, [loadQueueItems]);

  const value = useMemo(() => ({
    queueItems,
    completedCount,
    loadQueueItems,
    updateQueueItem,
    updateQueueItems,
    retryItem,
    retryItems,
    deleteItem,
    processQueueItems,
    isProcessing,
    refreshQueueStatus
  }), [queueItems, completedCount, loadQueueItems, updateQueueItem, updateQueueItems, retryItem, retryItems, deleteItem, processQueueItems, isProcessing, refreshQueueStatus]);

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};
