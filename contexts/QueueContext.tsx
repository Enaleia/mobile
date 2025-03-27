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
  isCompletelyFailed,
  shouldAutoRetry,
  PROCESSING_TIMEOUT
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
        // Filter out completely failed items before processing
        const itemsToProcess = items.filter(item => !isCompletelyFailed(item));
        if (itemsToProcess.length < items.length) {
          console.log(`Skipping ${items.length - itemsToProcess.length} items in critical state`);
        }
        if (itemsToProcess.length > 0) {
          await processQueueItems(itemsToProcess, wallet);
        }
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

  // Add periodic refresh effect
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    const startAutoRefresh = () => {
      if (AppState.currentState === 'active') {
        refreshInterval = setInterval(async () => {
          if (!processingRef.current) {
            await refreshQueueStatus();
          }
        }, 15000); // Refresh every 15 seconds when app is active
      }
    };
    
    startAutoRefresh();
    
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startAutoRefresh();
      } else {
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      }
    });
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      subscription.remove();
    };
  }, [isOnline]);

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
          // Check if item is in critical state (completely failed)
          if (isCompletelyFailed(item)) {
            console.log(`Item ${item.localId} is in critical state (exceeded retry limits), skipping retry`);
            continue;
          }

          // Reset item state based on service, preserving completed states
          const resetItem = {
            ...item,
            status: QueueItemStatus.PENDING,
            retryCount: (item.retryCount || 0) + 1,
            lastError: undefined,
            lastAttempt: undefined,
            // Reset Directus state only if:
            // 1. We're retrying Directus specifically, or
            // 2. We're retrying both services AND Directus isn't already completed
            directus: service === "eas" ? item.directus : 
              (item.directus?.status === ServiceStatus.COMPLETED ? item.directus : {
                ...item.directus,
                status: ServiceStatus.PENDING,
                error: undefined,
                eventId: undefined,
                linked: false
              }),
            // Reset EAS state only if:
            // 1. We're retrying EAS specifically, or
            // 2. We're retrying both services AND EAS isn't already completed
            eas: service === "directus" ? item.eas :
              (item.eas?.status === ServiceStatus.COMPLETED ? item.eas : {
                ...item.eas,
                status: ServiceStatus.PENDING,
                error: undefined,
                txHash: undefined
              })
          };

          // Check if this retry would exceed limits
          if (!shouldAutoRetry(resetItem)) {
            console.log(`Item ${item.localId} would exceed retry limits, moving to critical state`);
            // Update item to critical state
            const criticalItem = {
              ...item,
              status: QueueItemStatus.FAILED,
              lastError: "Exceeded retry limits",
              directus: {
                ...item.directus,
                status: ServiceStatus.FAILED,
                error: "Exceeded retry limits"
              },
              eas: {
                ...item.eas,
                status: ServiceStatus.FAILED,
                error: "Exceeded retry limits"
              }
            };
            const updatedItems = queueItems.map((qi) =>
              qi.localId === item.localId ? criticalItem : qi
            );
            await updateActiveQueue(updatedItems);
            setQueueItems(updatedItems);
            continue;
          }

          // Log the state changes
          console.log(`Retrying item ${item.localId}:`, {
            service,
            directusWasCompleted: item.directus?.status === ServiceStatus.COMPLETED,
            easWasCompleted: item.eas?.status === ServiceStatus.COMPLETED,
            directusNewStatus: resetItem.directus?.status,
            easNewStatus: resetItem.eas?.status
          });

          // Update queue with reset item
          const updatedItems = queueItems.map((qi) =>
            qi.localId === item.localId ? resetItem : qi
          );
          await updateActiveQueue(updatedItems);
          setQueueItems(updatedItems);

          // Process the item
          await processItem(resetItem);

          // Add delay between items
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

          // Update item state to failed
          const updatedItems = queueItems.map((qi) =>
            qi.localId === item.localId
              ? {
                  ...qi,
                  status: QueueItemStatus.FAILED,
                  lastError: errorMessage,
                  lastAttempt: new Date(),
                  directus: service === "eas" ? qi.directus : 
                    (qi.directus?.status === ServiceStatus.COMPLETED ? qi.directus : {
                      ...qi.directus,
                      status: ServiceStatus.FAILED,
                      error: errorMessage
                    }),
                  eas: service === "directus" ? qi.eas :
                    (qi.eas?.status === ServiceStatus.COMPLETED ? qi.eas : {
                      ...qi.eas,
                      status: ServiceStatus.FAILED,
                      error: errorMessage
                    }),
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
    const updatedItem = { ...item };
    const prevStatus = updatedItem.status;

    // 1. Network check (highest priority)
    if (!navigator.onLine) {
      return {
        ...updatedItem,
        status: QueueItemStatus.OFFLINE,
        lastError: "Device is offline"
      };
    }

    // 2. Check for stuck processing conditions
    const now = Date.now();
    const lastAttemptTime = item.lastAttempt ? new Date(item.lastAttempt).getTime() : 0;
    const timeSinceLastAttempt = now - lastAttemptTime;
    
    // Enhanced stuck detection:
    // - Item is in PROCESSING state overall
    // - OR one service is COMPLETED while other is stuck in PROCESSING
    // - OR processing time exceeded timeout
    // - OR no last attempt recorded
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
      console.log(`Item ${item.localId} detected as stuck:`, {
        overallStatus: item.status,
        directusStatus: item.directus?.status,
        easStatus: item.eas?.status,
        timeSinceLastAttempt: Math.round(timeSinceLastAttempt / 1000) + 's',
        hasLastAttempt: !!item.lastAttempt
      });

      // If one service completed but other failed, preserve the completed state
      return {
        ...updatedItem,
        status: QueueItemStatus.FAILED,
        lastError: "Operation timed out after 30 seconds",
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

    // 3. Determine service states
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

    // 4. Determine overall status based on service states
    let finalStatus: QueueItemStatus;
    let statusReason: string | undefined;

    if (directusState.isComplete && easState.isComplete) {
      finalStatus = QueueItemStatus.COMPLETED;
    } else if (directusState.isFailed || easState.isFailed) {
      finalStatus = QueueItemStatus.FAILED;
      statusReason = directusState.isFailed ? updatedItem.directus?.error : updatedItem.eas?.error;
    } else if (directusState.isProcessing || easState.isProcessing) {
      // Only set to PROCESSING if we have a recent last attempt
      if (!item.lastAttempt || timeSinceLastAttempt > PROCESSING_TIMEOUT) {
        finalStatus = QueueItemStatus.PENDING;
        statusReason = "Reset from stale processing state";
      } else {
        finalStatus = QueueItemStatus.PROCESSING;
      }
    } else {
      finalStatus = QueueItemStatus.PENDING;
    }

    // 5. Build the result with updated service states
    const result = {
      ...updatedItem,
      status: finalStatus,
      lastError: statusReason,
      directus: {
        ...updatedItem.directus,
        status: directusState.isComplete ? ServiceStatus.COMPLETED :
                directusState.isFailed ? ServiceStatus.FAILED :
                directusState.isProcessing && item.lastAttempt && timeSinceLastAttempt <= PROCESSING_TIMEOUT ? 
                ServiceStatus.PROCESSING : ServiceStatus.PENDING
      },
      eas: {
        ...updatedItem.eas,
        status: easState.isComplete ? ServiceStatus.COMPLETED :
                easState.isFailed ? ServiceStatus.FAILED :
                easState.isProcessing && item.lastAttempt && timeSinceLastAttempt <= PROCESSING_TIMEOUT ? 
                ServiceStatus.PROCESSING : ServiceStatus.PENDING
      }
    };

    // 6. Clear error state when moving back to pending
    if (finalStatus === QueueItemStatus.PENDING) {
      result.lastError = undefined;
      result.lastAttempt = undefined;
    }

    // 7. Log state transitions
    if (prevStatus !== finalStatus) {
      console.log(`Queue item ${item.localId} state transition:`, {
        from: prevStatus,
        to: finalStatus,
        reason: statusReason || 'Normal state progression',
        timeSinceLastAttempt: Math.round(timeSinceLastAttempt / 1000) + 's',
        services: {
          directus: {
            complete: directusState.isComplete,
            failed: directusState.isFailed,
            processing: directusState.isProcessing
          },
          eas: {
            complete: easState.isComplete,
            failed: easState.isFailed,
            processing: easState.isProcessing
          }
        }
      });
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

      // Process items in smaller chunks to prevent UI blocking
      const refreshedActiveItems = [];
      const chunkSize = 5;
      
      for (let i = 0; i < activeItems.length; i += chunkSize) {
        const chunk = activeItems.slice(i, i + chunkSize);
        const refreshedChunk = await Promise.all(
          chunk.map(item => refreshItemStatus(item))
        );
        refreshedActiveItems.push(...refreshedChunk);
        
        // Update storage immediately after each chunk is processed
        await updateActiveQueue(refreshedActiveItems);
        
        // Update UI after each chunk
        const currentItems = [...refreshedActiveItems, ...completedItems];
        setQueueItems(currentItems);
        
        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Emit update event
      queueEventEmitter.emit(QueueEvents.UPDATED);
      console.log("Queue status refresh completed");
    } catch (error) {
      console.error("Error refreshing queue status:", error);
      // Try to recover by reloading queue items
      try {
        await loadQueueItems();
      } catch (loadError) {
        console.error("Failed to recover from refresh error:", loadError);
      }
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
