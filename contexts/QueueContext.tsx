import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueueItem,
  QueueItemStatus,
  ServiceStatus,
  MAX_RETRIES,
  PROCESSING_TIMEOUT,
  isCompletelyFailed,
} from "@/types/queue";
import { processQueueItems } from "@/services/queueProcessor";
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

interface QueueContextType {
  queueItems: QueueItem[];
  loadQueueItems: () => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
  retryItems: (items: QueueItem[], service?: "directus" | "eas") => Promise<void>;
  completedCount: number;
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

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const { isConnected, isInternetReachable, isMetered } = useNetwork();
  const processingRef = useRef(false);
  const isOnline = isConnected && isInternetReachable;
  const backgroundManager = BackgroundTaskManager.getInstance();
  const { wallet } = useWallet();

  // Add initial load effect
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        console.log("Initializing queue on app launch...");
        await refreshQueueStatus();
      } catch (error) {
        console.error("Failed to initialize queue on app launch:", error);
      }
    };

    initializeQueue();
  }, []); // Empty dependency array means this runs once on mount

  // Load completed count on init
  useEffect(() => {
    AsyncStorage.getItem(COMPLETED_COUNT_KEY)
      .then((value) => setCompletedCount(value ? parseInt(value, 10) : 0))
      .catch(console.error);
  }, []);

  const updateCompletedCount = async (increment: number) => {
    const newCount = completedCount + increment;
    await AsyncStorage.setItem(COMPLETED_COUNT_KEY, newCount.toString());
    setCompletedCount(newCount);
  };

  const loadQueueItems = async (): Promise<void> => {
    try {
      // Load both active and completed queues
      const [activeItems, completedItems] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue(),
      ]);

      // Clean up expired completed items
      await cleanupExpiredItems();

      // Deduplicate items based on localId
      const seenIds = new Set<string>();
      const uniqueItems = [...activeItems, ...completedItems].filter(item => {
        if (seenIds.has(item.localId)) {
          return false;
        }
        seenIds.add(item.localId);
        return true;
      });

      // Set items with active items first, then completed items
      setQueueItems(uniqueItems);
    } catch (error) {
      console.error("Error loading queue items:", error);
      setQueueItems([]);
    }
  };

  const processItems = useCallback(
    async (items: QueueItem[]) => {
      try {
        processingRef.current = true;
        await processQueueItems(items, wallet);
      } catch (error) {
        console.error("Failed to process items:", error);
      } finally {
        processingRef.current = false;
      }
    },
    [wallet]
  );

  const processAllItems = useCallback(async () => {
    try {
      processingRef.current = true;
      await backgroundManager.processQueueItems(wallet);
    } catch (error) {
      console.error("Failed to process all items:", error);
    } finally {
      processingRef.current = false;
    }
  }, [wallet]);

  const processItem = useCallback(
    async (item: QueueItem) => {
      try {
        processingRef.current = true;
        await processQueueItems([item], wallet);
      } catch (error) {
        console.error("Failed to process item:", error);
      } finally {
        processingRef.current = false;
      }
    },
    [wallet]
  );

  // Add AppState listener for foreground/background detection
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          // App came to foreground, refresh status and process any pending items
          await refreshQueueStatus();

          const pendingItems = queueItems.filter(
            (item) =>
              item.status === QueueItemStatus.PENDING ||
              item.status === QueueItemStatus.OFFLINE
          );
          if (pendingItems.length > 0 && isOnline) {
            console.log("App active, processing pending items in foreground");
            // Ensure batch data is loaded before processing
            const batchData = await getBatchData();
            if (batchData) {
              processItems(pendingItems).catch((err) =>
                console.error("Failed to process queue in foreground:", err)
              );
            } else {
              console.warn(
                "Batch data not available, skipping queue processing"
              );
            }
          }
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [queueItems, isOnline, processItems]);

  const updateQueueItems = async (items: QueueItem[]): Promise<void> => {
    try {
      // Get existing items first
      const [existingActive, existingCompleted] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue(),
      ]);

      // Combine all items and deduplicate based on localId
      const seenIds = new Set<string>();
      const allItems = [...existingActive, ...existingCompleted, ...items].filter(item => {
        if (seenIds.has(item.localId)) {
          return false;
        }
        seenIds.add(item.localId);
        return true;
      });

      // Separate active and completed items
      const completedItems = allItems.filter(
        (item) => item.status === QueueItemStatus.COMPLETED
      );
      const activeItems = allItems.filter(
        (item) => item.status !== QueueItemStatus.COMPLETED
      );

      // Update active queue and verify
      await updateActiveQueue(activeItems);
      const savedItems = await getActiveQueue();
      if (!savedItems.length && activeItems.length > 0) {
        throw new Error("Failed to save active queue items");
      }

      // Move newly completed items to completed queue
      for (const item of completedItems) {
        if (!item.hasOwnProperty("completedAt")) {
          await addToCompletedQueue(item);
        }
      }

      // Update state with combined items
      setQueueItems(allItems);

      const pendingItems = activeItems.filter(
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

        // Ensure batch data is loaded before processing
        const batchData = await getBatchData();
        if (!batchData) {
          console.warn("Batch data not available, skipping queue processing");
          return;
        }

        // Process items sequentially
        for (const item of pendingItems) {
          try {
            if (appState === "active") {
              await processItem(item);
            } else {
              await processAllItems();
              break; // Only trigger background processing once
            }
            // Add delay between items
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to process item ${item.localId}:`, error);
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error updating queue items:", error);
      throw error;
    }
  };

  const retryItems = async (items: QueueItem[], service?: "directus" | "eas"): Promise<void> => {
    console.log("Retrying items:", {
      itemsToRetry: items.length,
      itemIds: items.map((i) => i.localId),
      service,
    });

    try {
      // Process items sequentially
      for (const item of items) {
        try {
          // Always increment retry count on manual retry
          const newRetryCount = (item.totalRetryCount || 0) + 1;
          console.log(`Incrementing retry count for item ${item.localId}: ${item.totalRetryCount || 0} -> ${newRetryCount}`);

          // Reset only the specified service or both if none specified
          const resetItem = {
            ...item,
            status: QueueItemStatus.PENDING,
            totalRetryCount: newRetryCount,
            lastError: undefined,
            lastAttempt: undefined,
            directus: service === "eas" ? item.directus : 
              item.directus?.status === ServiceStatus.COMPLETED ? item.directus : 
              { status: ServiceStatus.PENDING, error: undefined },
            eas: service === "directus" ? item.eas : 
              item.eas?.status === ServiceStatus.COMPLETED ? item.eas : 
              { status: ServiceStatus.PENDING, error: undefined },
          } as QueueItem;

          // Update queue with reset item
          const updatedItems = queueItems.map((qi) =>
            qi.localId === item.localId ? resetItem : qi
          );
          await updateActiveQueue(updatedItems);
          setQueueItems(updatedItems);

          // Process the item
          await processItem(resetItem);
        } catch (error) {
          console.error(`Error retrying item ${item.localId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in retryItems:", error);
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

  // Network recovery handler
  useEffect(() => {
    console.log("Network state changed:", {
      isOnline,
      queueItemsCount: queueItems.length,
      processingRef: processingRef.current,
      appState: AppState.currentState,
      hasWallet: !!wallet,
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
      AppState.currentState === "active" &&
      wallet
    ) {
      // Check token expiration before attempting reauthorization
      const checkTokenAndProcess = async () => {
        try {
          // First check if we have a valid token
          const token = await SecureStore.getItemAsync("auth_token");
          if (token) {
            // Set the token in directus client
            directus.setToken(token);
            console.log("Using existing valid token");
          } else {
            // If no token, check expiry and try to reauthorize
            const expiryStr = await SecureStore.getItemAsync("token_expiry");
            const now = new Date();

            if (
              !expiryStr ||
              new Date(expiryStr).getTime() - now.getTime() <
                24 * 24 * 60 * 60 * 1000
            ) {
              console.log(
                "Token expired or near expiry, attempting reauthorization"
              );
              const reauthorized = await reauthorizeWithStoredCredentials();
              if (!reauthorized) {
                console.log("Failed to reauthorize, skipping queue processing");
                return;
              }
            } else {
              console.log(
                "Token still valid, proceeding with queue processing"
              );
            }
          }

          // Only process pending and offline items in foreground when network recovers
          console.log(
            "Network recovered, processing pending items in foreground"
          );
          const pendingItems = queueItems.filter(
            (item) =>
              (item.status === QueueItemStatus.PENDING ||
                item.status === QueueItemStatus.OFFLINE) &&
              (!item.lastAttempt ||
                new Date(item.lastAttempt).getTime() < Date.now() - 30000) // Don't retry items attempted in last 30 seconds
          );
          if (pendingItems.length > 0) {
            // Ensure batch data is available before processing
            const batchData = await getBatchData();
            if (!batchData) {
              console.warn(
                "Batch data not available, skipping queue processing"
              );
              return;
            }
            await processItems(pendingItems);
          }
        } catch (error) {
          console.error("Error in network recovery handler:", error);
        }
      };

      checkTokenAndProcess();
    }
  }, [isOnline, wallet]);

  // Update completed count when items complete
  useEffect(() => {
    const completedItems = queueItems.filter(
      (item) => item.status === QueueItemStatus.COMPLETED
    );
    if (completedItems.length !== completedCount) {
      updateCompletedCount(completedItems.length - completedCount);
    }
  }, [queueItems]);

  const reauthorizeWithStoredCredentials = async (): Promise<boolean> => {
    try {
      // First check if we have a valid token
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        // Set the token in directus client
        directus.setToken(token);
        return true;
      }

      // If no valid token, try to login with stored credentials
      const email = await SecureStore.getItemAsync("user_email");
      const password = await SecureStore.getItemAsync("user_password");

      if (!email || !password) {
        console.log("No stored credentials found for reauthorization");
        return false;
      }

      try {
        const loginResult = await directus.login(email, password);
        if (!loginResult.access_token) {
          console.error("No access token in login result");
          return false;
        }
        return true;
      } catch (error) {
        console.error("Failed to reauthorize with stored credentials:", error);
        // Clear stored credentials on auth failure
        await SecureStore.deleteItemAsync("user_email");
        await SecureStore.deleteItemAsync("user_password");
        return false;
      }
    } catch (error) {
      console.error("Error in reauthorizeWithStoredCredentials:", error);
      return false;
    }
  };

  const refreshItemStatus = async (item: QueueItem): Promise<QueueItem> => {
    const updatedItem = { ...item };
    const prevStatus = updatedItem.status;

    // Helper function for service status string
    const getServiceStatusString = (service: 'directus' | 'eas') => {
      const status = service === 'directus' ? updatedItem.directus?.status : updatedItem.eas?.status;
      return `[${service === 'directus' ? 'Directus' : 'EAS'}: ${status}]`;
    };

    // Helper function for attempt info
    const getAttemptInfo = () => {
      return `Attempt: #${updatedItem.totalRetryCount || 0}/${MAX_RETRIES} total`;
    };

    // Helper function for time since last attempt
    const getTimeSinceLastAttempt = () => {
      if (!item.lastAttempt) return 'No previous attempt';
      const seconds = Math.round((Date.now() - new Date(item.lastAttempt).getTime()) / 1000);
      return `${seconds}s ago`;
    };

    // 1. Network check (highest priority)
    if (!navigator.onLine) {
      console.log(`[QueueMonitor] State Transition [${item.localId}] ${prevStatus} → ${QueueItemStatus.OFFLINE}
    ${getAttemptInfo()}
    Last attempt: ${getTimeSinceLastAttempt()}
    Services: ${getServiceStatusString('directus')} ${getServiceStatusString('eas')}`);
      
      return {
        ...updatedItem,
        status: QueueItemStatus.OFFLINE,
        lastError: "Device is offline",
        totalRetryCount: updatedItem.totalRetryCount // Preserve retry count
      };
    }

    // 2. Check for stuck processing conditions
    const now = Date.now();
    const lastAttemptTime = item.lastAttempt ? new Date(item.lastAttempt).getTime() : 0;
    const timeSinceLastAttempt = now - lastAttemptTime;
    
    const isStuck = Boolean(
      (item.status === QueueItemStatus.PROCESSING &&
       (timeSinceLastAttempt > PROCESSING_TIMEOUT || !item.lastAttempt)) ||
      (item.directus?.status === ServiceStatus.COMPLETED && 
       item.eas?.status === ServiceStatus.PROCESSING && 
       timeSinceLastAttempt > PROCESSING_TIMEOUT) ||
      (item.eas?.status === ServiceStatus.COMPLETED && 
       item.directus?.status === ServiceStatus.PROCESSING && 
       timeSinceLastAttempt > PROCESSING_TIMEOUT)
    );

    if (isStuck) {
      console.log(`[QueueMonitor] Item Stuck [${item.localId}]
    ${getAttemptInfo()}
    Last attempt: ${getTimeSinceLastAttempt()}
    Services: ${getServiceStatusString('directus')} ${getServiceStatusString('eas')}`);

      return {
        ...updatedItem,
        status: QueueItemStatus.FAILED,
        lastError: "Operation timed out after 30 seconds",
        totalRetryCount: updatedItem.totalRetryCount, // Preserve retry count
        directus: {
          ...updatedItem.directus,
          status: updatedItem.directus?.status === ServiceStatus.COMPLETED ? 
                 ServiceStatus.COMPLETED : ServiceStatus.FAILED,
          error: updatedItem.directus?.status !== ServiceStatus.COMPLETED ? 
                "Operation timed out" : undefined
        },
        eas: {
          ...updatedItem.eas,
          status: updatedItem.eas?.status === ServiceStatus.COMPLETED ? 
                 ServiceStatus.COMPLETED : ServiceStatus.FAILED,
          error: updatedItem.eas?.status !== ServiceStatus.COMPLETED ? 
                "Operation timed out" : undefined
        }
      };
    }

    // Rest of your existing state determination logic...
    const directusState = {
      isComplete: Boolean(updatedItem.directus?.eventId),
      isFailed: updatedItem.directus?.status === ServiceStatus.FAILED,
      isProcessing: updatedItem.directus?.status === ServiceStatus.PROCESSING
    };

    const easState = {
      isComplete: Boolean(updatedItem.eas?.txHash),
      isFailed: updatedItem.eas?.status === ServiceStatus.FAILED,
      isProcessing: updatedItem.eas?.status === ServiceStatus.PROCESSING
    };

    // Determine final status...
    let finalStatus: QueueItemStatus;
    let statusReason: string | undefined;

    if (directusState.isComplete && easState.isComplete) {
      finalStatus = QueueItemStatus.COMPLETED;
    } else if (directusState.isFailed || easState.isFailed) {
      finalStatus = QueueItemStatus.FAILED;
      statusReason = directusState.isFailed ? updatedItem.directus?.error : updatedItem.eas?.error;
    } else if (directusState.isProcessing || easState.isProcessing) {
      finalStatus = QueueItemStatus.PROCESSING;
    } else {
      finalStatus = QueueItemStatus.PENDING;
    }

    const result = {
      ...updatedItem,
      status: finalStatus,
      lastError: statusReason,
      totalRetryCount: updatedItem.totalRetryCount, // Preserve retry count
      directus: {
        ...updatedItem.directus,
        status: directusState.isComplete ? ServiceStatus.COMPLETED :
                directusState.isFailed ? ServiceStatus.FAILED :
                directusState.isProcessing ? ServiceStatus.PROCESSING :
                ServiceStatus.PENDING
      },
      eas: {
        ...updatedItem.eas,
        status: easState.isComplete ? ServiceStatus.COMPLETED :
                easState.isFailed ? ServiceStatus.FAILED :
                easState.isProcessing ? ServiceStatus.PROCESSING :
                ServiceStatus.PENDING
      }
    };

    if (prevStatus !== finalStatus) {
      console.log(`[QueueMonitor] State Transition [${item.localId}] ${prevStatus} → ${finalStatus}
    ${getAttemptInfo()}
    Last attempt: ${getTimeSinceLastAttempt()}
    Services: ${getServiceStatusString('directus')} ${getServiceStatusString('eas')}`);
    }

    return result;
  };

  const refreshQueueStatus = async () => {
    try {
      console.log("Refreshing queue status...");
      const [activeItems, completedItems] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue(),
      ]);

      // Refresh status for active items
      const refreshedActiveItems = await Promise.all(
        activeItems.map(item => refreshItemStatus(item))
      );

      // Update active queue with refreshed items
      await updateActiveQueue(refreshedActiveItems);

      // Combine active and completed items
      const allItems = [...refreshedActiveItems, ...completedItems];

      // Update state
      setQueueItems(allItems);

      // Emit update event
      queueEventEmitter.emit(QueueEvents.UPDATED);
      console.log("Queue status refresh completed");
    } catch (error) {
      console.error("Error refreshing queue status:", error);
    }
  };

  return (
    <QueueContext.Provider
      value={{
        queueItems,
        loadQueueItems,
        updateQueueItems,
        retryItems,
        completedCount,
        refreshQueueStatus,
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
