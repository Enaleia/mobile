import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus, ServiceStatus, isCompletelyFailed } from "@/types/queue";
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
          // Reset only the specified service or both if none specified
          const resetItem = {
            ...item,
            status: QueueItemStatus.PENDING,
            totalRetryCount: (item.totalRetryCount || 0) + 1,
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
          console.error(`Failed to process item ${item.localId}:`, error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          // Check if it's an auth error
          const isAuthError =
            errorMessage.toLowerCase().includes("token") ||
            errorMessage.toLowerCase().includes("auth") ||
            errorMessage.toLowerCase().includes("unauthorized");

          if (isAuthError) {
            console.log("Auth error detected, stopping retry process");
            break;
          }

          // Update item state to failed for the specified service with detailed error message
          const updatedItems = queueItems.map((qi) =>
            qi.localId === item.localId
              ? {
                  ...qi,
                  status: QueueItemStatus.FAILED,
                  lastError: errorMessage,
                  lastAttempt: new Date().toISOString(),
                  directus: service === "eas" ? qi.directus : { 
                    status: ServiceStatus.FAILED, 
                    error: errorMessage 
                  },
                  eas: service === "directus" ? qi.eas : { 
                    status: ServiceStatus.FAILED, 
                    error: errorMessage 
                  },
                }
              : qi
          );
          await updateActiveQueue(updatedItems);
          setQueueItems(updatedItems);
        }
      }
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
    const networkInfo = await NetInfo.fetch();
    const isConnected = networkInfo.isConnected;
    
    // Create a copy of the item to modify
    const updatedItem = { ...item };
    let statusChanged = false;

    // First check if the item is completely failed
    if (isCompletelyFailed(item)) {
      // Maintain failed status for both services and overall status
      updatedItem.status = QueueItemStatus.FAILED;
      updatedItem.directus = {
        ...updatedItem.directus,
        status: ServiceStatus.FAILED
      };
      updatedItem.eas = {
        ...updatedItem.eas,
        status: ServiceStatus.FAILED
      };
      return updatedItem;
    }

    // Check Directus status based on stored values
    if (updatedItem.directus?.eventId) {
      // If we have an eventId, Directus was successful
      if (updatedItem.directus.status !== ServiceStatus.COMPLETED) {
        statusChanged = true;
      }
      updatedItem.directus = {
        ...updatedItem.directus,
        status: ServiceStatus.COMPLETED,
      };
    } else {
      if (updatedItem.directus?.status !== ServiceStatus.PENDING) {
        statusChanged = true;
      }
      updatedItem.directus = {
        ...updatedItem.directus,
        status: ServiceStatus.PENDING,
      };
    }

    // Check EAS status based on stored values
    if (updatedItem.eas?.txHash) {
      if (updatedItem.eas.status !== ServiceStatus.COMPLETED) {
        statusChanged = true;
      }
      updatedItem.eas = {
        ...updatedItem.eas,
        status: ServiceStatus.COMPLETED,
      };
    } else {
      if (updatedItem.eas?.status !== ServiceStatus.PENDING) {
        statusChanged = true;
      }
      updatedItem.eas = {
        ...updatedItem.eas,
        status: ServiceStatus.PENDING,
      };
    }

    // Check linking status only if online
    if (isConnected && updatedItem.directus?.eventId && updatedItem.eas?.txHash) {
      try {
        const event = await getEvent(updatedItem.directus.eventId);
        if (event && event[0]) {
          // Check if EAS UID is linked to Directus event
          const isLinked = event[0].EAS_UID === updatedItem.eas.txHash;
          const wasLinked = updatedItem.directus.linked || false;
          if (isLinked !== wasLinked) {
            statusChanged = true;
          }
          updatedItem.directus = {
            ...updatedItem.directus,
            linked: isLinked,
          };
        }
      } catch (error) {
        console.error(`Error checking linking status for item ${updatedItem.localId}:`, error);
        // Keep existing linking status if check fails
        updatedItem.directus = {
          ...updatedItem.directus,
          linked: updatedItem.directus.linked || false,
        };
      }
    } else if (!isConnected) {
      // When offline, preserve existing linking status
      updatedItem.directus = {
        ...updatedItem.directus,
        linked: updatedItem.directus?.linked || false,
      };
    }

    // Update overall status based on service statuses
    const prevStatus = updatedItem.status;
    
    if (updatedItem.directus?.status === ServiceStatus.COMPLETED && 
        updatedItem.eas?.status === ServiceStatus.COMPLETED) {
      // Both services completed - mark as COMPLETED
      updatedItem.status = QueueItemStatus.COMPLETED;
    } else if (updatedItem.status === QueueItemStatus.COMPLETED || 
               updatedItem.status === QueueItemStatus.PROCESSING ||
               updatedItem.status === QueueItemStatus.FAILED) {
      // Reset to PENDING if:
      // 1. Item was marked as COMPLETED but services aren't complete
      // 2. Item is stuck in PROCESSING but services aren't complete
      // 3. Item was marked as FAILED but services aren't actually in failed state
      updatedItem.status = QueueItemStatus.PENDING;
      
      // Reset last attempt time to allow immediate processing
      updatedItem.lastAttempt = undefined;
      
      // Clear last error if we're resetting from FAILED
      if (prevStatus === QueueItemStatus.FAILED) {
        updatedItem.lastError = undefined;
      }
      
      if (prevStatus !== updatedItem.status) {
        console.log(`Reset item ${updatedItem.localId} from ${prevStatus} to PENDING`);
        statusChanged = true;
      }
    }
    
    if (statusChanged) {
      console.log(`Item ${updatedItem.localId} status refreshed: ${JSON.stringify({
        oldStatus: prevStatus,
        newStatus: updatedItem.status,
        directus: {
          old: item.directus?.status,
          new: updatedItem.directus?.status,
          linked: updatedItem.directus?.linked
        },
        eas: {
          old: item.eas?.status,
          new: updatedItem.eas?.status
        }
      })}`);
    }

    return updatedItem;
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
