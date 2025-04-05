import {
  createEvent,
  createMaterialInput,
  createMaterialOutput,
  updateEvent,
  getEvent,
} from "@/services/directus";
import { EASService, EAS_CONSTANTS } from "@/services/eas";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { BatchData } from "@/types/batch";
import { DirectusCollector } from "@/types/collector";
import { EnaleiaEASSchema } from "@/types/enaleia";
import {
  MaterialTrackingEvent,
  MaterialTrackingEventInput,
  MaterialTrackingEventOutput,
} from "@/types/event";
import { DirectusMaterial, MaterialsData } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import {
  MAX_RETRIES,
  QueueItem,
  QueueItemStatus,
  ServiceStatus,
  getOverallStatus,
  PROCESSING_TIMEOUT,
  shouldAutoRetry,
  shouldProcessService,
  determineItemStatus
} from "@/types/queue";
import { EnaleiaUser } from "@/types/user";
import { WalletInfo } from "@/types/wallet";
import { getBatchData } from "@/utils/batchStorage";
import { ensureValidToken } from "@/utils/directus";
import {
  fundWallet,
  getWalletBalance,
  mapToEASSchema,
  validateEASSchema,
} from "@/utils/eas";
import {
  addToCompletedQueue,
  getActiveQueue,
  removeFromActiveQueue,
  updateActiveQueue,
} from "@/utils/queueStorage";
import { getBatchCacheKey } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { Company } from "@/types/company";
import { JsonRpcProvider } from "ethers";
import { queueDebugMonitor } from "@/utils/queueDebugMonitor";

let currentProcessingTimeout: NodeJS.Timeout | null = null;
let currentProcessingItemId: string | null = null;
let currentEASProvider: JsonRpcProvider | null = null;

let processingPromise: Promise<void> | null = null;
let isProcessing = false;

const STUCK_PROCESSING_THRESHOLD = 1 * 60 * 1000; // X minutes

export async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  try {
    queueDebugMonitor.log(`\n┌─ Updating Item ${itemId} in Cache ─┐`);
    queueDebugMonitor.log('├─ Updates:', updates);

    const items = await getActiveQueue();
    if (!items || !Array.isArray(items)) {
      queueDebugMonitor.log('└─ Invalid queue data, resetting to empty array');
      await updateActiveQueue([]);
      return;
    }

    const currentItem = items.find(item => item.localId === itemId);
    if (!currentItem) {
      queueDebugMonitor.log('└─ Item not found in active queue');
      return;
    }

    queueDebugMonitor.log('├─ Current item state:', {
      status: currentItem.status,
      retries: currentItem.totalRetryCount,
      directus: currentItem.directus?.status,
      eas: currentItem.eas?.status,
      linking: currentItem.linking?.status
    });

    // Create a safe update object with all required fields
    const safeUpdates: QueueItem = {
      ...currentItem, // Keep all existing fields
      ...updates, // Apply updates
      // Ensure required fields are present
      localId: itemId,
      date: updates.date || currentItem.date,
      // Track total retry count safely
      totalRetryCount: typeof updates.totalRetryCount === 'number' ? 
        updates.totalRetryCount : 
        (currentItem.totalRetryCount || 0),
            // Safely merge service states
            directus: updates.directus ? { 
        ...(currentItem.directus || {}), 
        ...updates.directus,
        status: updates.directus.status || ServiceStatus.INCOMPLETE
      } : currentItem.directus,
            eas: updates.eas ? { 
        ...(currentItem.eas || {}), 
        ...updates.eas,
        status: updates.eas.status || ServiceStatus.INCOMPLETE
      } : currentItem.eas,
      linking: updates.linking ? {
        ...(currentItem.linking || {}),
        ...updates.linking,
        status: updates.linking.status || ServiceStatus.INCOMPLETE
      } : currentItem.linking
    };

            // Update overall status based on service states
    safeUpdates.status = getOverallStatus(safeUpdates);

    queueDebugMonitor.log('├─ Updated item state:', {
      status: safeUpdates.status,
      retries: safeUpdates.totalRetryCount,
      directus: safeUpdates.directus?.status,
      eas: safeUpdates.eas?.status,
      linking: safeUpdates.linking?.status
    });

    // Update the item in the appropriate queue based on its status
    if (safeUpdates.status === QueueItemStatus.COMPLETED) {
      queueDebugMonitor.log('├─ Moving item to completed queue');
      await addToCompletedQueue(safeUpdates);
      await removeFromActiveQueue(itemId);
      queueDebugMonitor.log('└─ Item successfully moved to completed queue');
    } else {
      queueDebugMonitor.log('└─ Updating item in active queue');
      await updateActiveQueue(items.map(item => 
        item.localId === itemId ? safeUpdates : item
      ));
    }

    queueEventEmitter.emit(QueueEvents.UPDATED);
  } catch (error) {
    queueDebugMonitor.error("└─ Error updating item in cache:", error);
    throw error;
  }
}

async function notifyUser(title: string, body: string) {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      queueDebugMonitor.log("Failed to get push token for push notification!");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    queueDebugMonitor.error("Error sending notification:", error);
  }
}

let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

interface RequiredData {
  userData: EnaleiaUser | null;
  materials: DirectusMaterial[];
  materialOptions: MaterialsData["options"];
  products: DirectusProduct[];
}

const directusCollectors = async () => {
  const cacheKey = "ENALEIA_BATCH";

  const storedData = await AsyncStorage.getItem(cacheKey);

  let directusCollectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity"
  >[] = [];
  if (storedData) {
    try {
      const cache = JSON.parse(storedData);
      const batchDataQuery = Object.values(
        cache.clientState?.queries || {}
      ).find(
        (query: any) =>
          Array.isArray(query?.queryKey) &&
          query?.queryKey.length === 1 &&
          query?.queryKey[0] === getBatchCacheKey()
      ) as { state: { data: BatchData } } | undefined;
      directusCollectors = cache?.collectors || [];
      if (batchDataQuery) {
        directusCollectors = batchDataQuery.state?.data?.collectors || [];
      }
      return directusCollectors;
    } catch (error) {
      queueDebugMonitor.error("Error accessing batch data cache:", error);
      throw new Error("Failed to access batch data - please refresh the app");
    }
  } else {
    return [];
  }
};

async function fetchRequiredData(
  retryCount = 0,
  maxRetries = 3
): Promise<RequiredData> {
  try {
    // Get user data from AsyncStorage where AuthContext stores it
    const userInfoString = await AsyncStorage.getItem("user_info");
    if (!userInfoString) {
      throw new Error("No user data found - please log in again");
    }

    const userData = JSON.parse(userInfoString) as EnaleiaUser;
    if (!userData || !userData.token) {
      throw new Error("Invalid user data - please log in again");
    }

    // Get batch data from the new storage system
    const batchData = await getBatchData();
    if (!batchData) {
      if (retryCount < maxRetries) {
        queueDebugMonitor.log(
          `No batch data found, retrying in 1s (${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchRequiredData(retryCount + 1, maxRetries);
      }
      throw new Error("No batch data found - please refresh the app");
    }

    const { materials, materialOptions, products } = batchData;

    // Validate the data
    if (
      !Array.isArray(materials) ||
      !materials.length ||
      !Array.isArray(materialOptions) ||
      !materialOptions.length ||
      !Array.isArray(products) ||
      !products.length
    ) {
      if (retryCount < maxRetries) {
        queueDebugMonitor.log(
          `Invalid or empty data, retrying in 1s (${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchRequiredData(retryCount + 1, maxRetries);
      }
      throw new Error("Invalid or empty batch data");
    }

    // Ensure products have all required fields
    const validProducts = products.filter(
      (p): p is DirectusProduct =>
        p && typeof p === "object" && "product_id" in p
    );

    if (!validProducts.length) {
      throw new Error("No valid products found");
    }

    return {
      userData,
      materials,
      materialOptions,
      products: validProducts,
    };
  } catch (error) {
    queueDebugMonitor.error("Error in fetchRequiredData:", error);
    throw error;
  }
}

async function processEASAttestation(
  item: QueueItem,
  requiredData: RequiredData,
  wallet: WalletInfo
): Promise<{ uid: string }> {
  const { userData, materials, products } = requiredData;
  const easService = new EASService(wallet.privateKey);

  try {
    // Check blockchain connectivity first
    try {
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_NETWORK_PROVIDER);
      await provider.getNetwork();
      
      // If we get here, network is back online
      // If service was previously incomplete, update it back to incomplete
      if (item.eas?.status === ServiceStatus.INCOMPLETE) {
        await updateItemInCache(item.localId, {
          eas: {
            ...item.eas,
            status: ServiceStatus.INCOMPLETE,
            error: undefined
          }
        });
      }
    } catch (networkError) {
      throw new Error('BLOCKCHAIN_OFFLINE');
    }

    // Ensure wallet has sufficient balance
    let balance = await getWalletBalance(wallet.address);
    if (!balance) throw new Error("Could not retrieve wallet balance");

    if (parseFloat(balance) < EAS_CONSTANTS.MINIMUM_BALANCE) {
      await fundWallet(wallet.address);
      balance = await getWalletBalance(wallet.address);

      if (!balance || parseFloat(balance) < EAS_CONSTANTS.MINIMUM_BALANCE) {
        throw new Error(`Insufficient funds after funding attempt: ${balance}`);
      }
    }

    // Prepare and validate schema
    const collectors = await directusCollectors();
    const company =
      typeof userData?.Company === "number"
        ? undefined
        : (userData?.Company as Pick<Company, "id" | "name" | "coordinates">);
    const schema: EnaleiaEASSchema = mapToEASSchema(
      item,
      userData,
      materials,
      products,
      collectors
    );

    if (!validateEASSchema(schema)) {
      throw new Error("Invalid schema");
    }

    // Process attestation
    const result = await easService.attest(schema);
    if (!result?.uid) {
      throw new Error("Invalid attestation result");
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'BLOCKCHAIN_OFFLINE') {
      throw error;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function isItemStuck(item: QueueItem): boolean {
  if (!item.lastAttempt) return false;
  const timeSinceLastAttempt = Date.now() - new Date(item.lastAttempt).getTime();
  const isStuck = timeSinceLastAttempt > STUCK_PROCESSING_THRESHOLD;
  
  // Format time in a readable way
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  queueDebugMonitor.log(`\n┌─ Checking if item ${item.localId} is stuck ─┐`);
  queueDebugMonitor.log('├─ Time Analysis:');
  queueDebugMonitor.log('│  ├─ Last Attempt:', item.lastAttempt);
  queueDebugMonitor.log('│  ├─ Time Since:', formatTime(timeSinceLastAttempt));
  queueDebugMonitor.log('│  ├─ Threshold:', formatTime(STUCK_PROCESSING_THRESHOLD));
  queueDebugMonitor.log('│  └─ Is Stuck:', isStuck);
  queueDebugMonitor.log('└─ Service States:');
  queueDebugMonitor.log('   ├─ Directus:', item.directus?.status || 'N/A');
  queueDebugMonitor.log('   ├─ EAS:', item.eas?.status || 'N/A');
  queueDebugMonitor.log('   └─ Linking:', item.linking?.status || 'N/A');
  
  return isStuck;
}

function isItemStuckInProcessing(item: QueueItem): boolean {
  const isStuck = item.status === QueueItemStatus.PROCESSING && isItemStuck(item);
  queueDebugMonitor.log(`\n┌─ Checking if item ${item.localId} is stuck in processing ─┐`);
  queueDebugMonitor.log('├─ Status:', item.status);
  queueDebugMonitor.log('├─ Last Attempt:', item.lastAttempt);
  queueDebugMonitor.log('├─ Time Since:', item.lastAttempt ? 
    `${(Date.now() - new Date(item.lastAttempt).getTime()) / 1000}s` : 'N/A');
  queueDebugMonitor.log('├─ Threshold:', `${STUCK_PROCESSING_THRESHOLD / 1000}s`);
  queueDebugMonitor.log('└─ Is Stuck:', isStuck);
  return isStuck;
}

async function handleStuckProcessingItem(item: QueueItem) {
  queueDebugMonitor.log(`\n┌─ Handling stuck processing item ${item.localId} ─┐`);
  queueDebugMonitor.log('├─ Current Item State:');
  queueDebugMonitor.log('│  ├─ Status:', item.status);
  queueDebugMonitor.log('│  ├─ Last Attempt:', item.lastAttempt);
  queueDebugMonitor.log('│  ├─ Time Since Last Attempt:', item.lastAttempt ? 
    `${(Date.now() - new Date(item.lastAttempt).getTime()) / 1000}s` : 'N/A');
  queueDebugMonitor.log('│  ├─ Total Retry Count:', item.totalRetryCount || 0);
  queueDebugMonitor.log('│  ├─ Last Error:', item.lastError || 'None');
  queueDebugMonitor.log('│  ├─ Directus Status:', item.directus?.status || 'N/A');
  queueDebugMonitor.log('│  ├─ EAS Status:', item.eas?.status || 'N/A');
  queueDebugMonitor.log('│  └─ Linking Status:', item.linking?.status || 'N/A');
  
  try {
    // First try to refresh the status by checking service states
    const activeQueue = await getActiveQueue();
    const currentItem = activeQueue.find(i => i.localId === item.localId);
    
    if (!currentItem) {
      queueDebugMonitor.log('└─ Item not found in active queue, proceeding with reset');
      return resetStuckItem(item);
    }

    queueDebugMonitor.log('├─ Refreshed Item State:');
    queueDebugMonitor.log('│  ├─ Status:', currentItem.status);
    queueDebugMonitor.log('│  ├─ Last Attempt:', currentItem.lastAttempt);
    queueDebugMonitor.log('│  ├─ Time Since Last Attempt:', currentItem.lastAttempt ? 
      `${(Date.now() - new Date(currentItem.lastAttempt).getTime()) / 1000}s` : 'N/A');
    queueDebugMonitor.log('│  ├─ Total Retry Count:', currentItem.totalRetryCount || 0);
    queueDebugMonitor.log('│  ├─ Last Error:', currentItem.lastError || 'None');
    queueDebugMonitor.log('│  ├─ Directus Status:', currentItem.directus?.status || 'N/A');
    queueDebugMonitor.log('│  ├─ EAS Status:', currentItem.eas?.status || 'N/A');
    queueDebugMonitor.log('│  └─ Linking Status:', currentItem.linking?.status || 'N/A');

    // Check if any services have completed
    const hasCompletedServices = 
      currentItem.directus?.status === ServiceStatus.COMPLETED ||
      currentItem.eas?.status === ServiceStatus.COMPLETED ||
      currentItem.linking?.status === ServiceStatus.COMPLETED;

    if (hasCompletedServices) {
      queueDebugMonitor.log('└─ Some services completed, updating status...');
      await updateItemInCache(item.localId, {
        status: getOverallStatus(currentItem),
        lastAttempt: new Date().toISOString()
      });
      return;
    }

    // If no services completed, reset the item
    queueDebugMonitor.log('└─ No services completed, resetting item...');
    return resetStuckItem(item);
  } catch (error) {
    queueDebugMonitor.error('└─ Error handling stuck processing item:', error);
    return resetStuckItem(item);
  }
}

async function resetStuckItem(item: QueueItem) {
  queueDebugMonitor.log(`\n┌─ Resetting stuck item ${item.localId} ─┐`);
  queueDebugMonitor.log('├─ Current State:');
  queueDebugMonitor.log('│  ├─ Status:', item.status);
  queueDebugMonitor.log('│  ├─ Last Attempt:', item.lastAttempt);
  queueDebugMonitor.log('│  ├─ Time Since Last Attempt:', item.lastAttempt ? 
    `${(Date.now() - new Date(item.lastAttempt).getTime()) / 1000}s` : 'N/A');
  queueDebugMonitor.log('│  ├─ Total Retry Count:', item.totalRetryCount || 0);
  queueDebugMonitor.log('│  ├─ Last Error:', item.lastError || 'None');
  queueDebugMonitor.log('│  ├─ Directus Status:', item.directus?.status || 'N/A');
  queueDebugMonitor.log('│  ├─ EAS Status:', item.eas?.status || 'N/A');
  queueDebugMonitor.log('│  └─ Linking Status:', item.linking?.status || 'N/A');
  
  // Kill any ongoing EAS provider connection
  if (currentEASProvider) {
    try {
      queueDebugMonitor.log('├─ Terminating EAS provider connection');
      // @ts-ignore - _websocket exists but is not in type definitions
      if (currentEASProvider._websocket) {
        // @ts-ignore
        currentEASProvider._websocket.terminate();
      }
      currentEASProvider = null;
    } catch (error) {
      queueDebugMonitor.log("└─ Error closing provider:", error);
    }
  }

  // Reset processing state
  currentProcessingItemId = null;

  // Update item state to allow retry
    await updateItemInCache(item.localId, {
    status: QueueItemStatus.PENDING,
      lastError: "Operation timed out",
    lastAttempt: undefined,
    // Reset service states to incomplete
    directus: item.directus?.status === ServiceStatus.COMPLETED ? 
      item.directus : 
      { ...item.directus, status: ServiceStatus.INCOMPLETE, error: "Operation timed out" },
    eas: item.eas?.status === ServiceStatus.COMPLETED ? 
      item.eas : 
      { ...item.eas, status: ServiceStatus.INCOMPLETE, error: "Operation timed out" },
    linking: item.linking?.status === ServiceStatus.COMPLETED ? 
      item.linking : 
      { ...item.linking, status: ServiceStatus.INCOMPLETE, error: "Operation timed out" }
  });

  queueDebugMonitor.log('└─ Reset Complete:');
  queueDebugMonitor.log('   ├─ Status: PENDING');
  queueDebugMonitor.log('   ├─ Last Attempt: Cleared');
  queueDebugMonitor.log('   └─ Error: Operation timed out');
  
  // Emit queue update event to refresh UI
  queueEventEmitter.emit(QueueEvents.UPDATED);
}

export async function cancelCurrentProcessing() {
  if (currentProcessingTimeout) {
    clearTimeout(currentProcessingTimeout);
    currentProcessingTimeout = null;
  }
  
  if (currentProcessingItemId) {
    const items = await getActiveQueue();
    const currentItem = items.find(i => i.localId === currentProcessingItemId);
    if (currentItem) {
      await updateItemInCache(currentProcessingItemId, {
        status: QueueItemStatus.FAILED,
        lastError: "Processing cancelled",
        // Mark services as incomplete
        directus: currentItem.directus?.status === ServiceStatus.COMPLETED ? 
          currentItem.directus : 
          { ...currentItem.directus, status: ServiceStatus.INCOMPLETE, error: "Operation cancelled" },
        eas: currentItem.eas?.status === ServiceStatus.COMPLETED ? 
          currentItem.eas : 
          { ...currentItem.eas, status: ServiceStatus.INCOMPLETE, error: "Operation cancelled" }
      });
    }
    currentProcessingItemId = null;
  }
  
  isProcessing = false;
}

export async function processQueueItems(
  itemsToProcess?: QueueItem[],
  wallet?: WalletInfo | null
) {
  if (!itemsToProcess?.length) {
    return;
  }

  // If already processing, wait for it to complete
  if (processingPromise) {
    queueDebugMonitor.log("Already processing queue items");
    return processingPromise;
  }

  processingPromise = (async () => {
    try {
      isProcessing = true;

      // First check for and handle any stuck processing items
      queueDebugMonitor.log("\n┌─ Checking for stuck processing items ─┐");
      const activeQueue = await getActiveQueue();
      
      // Check for any items in PROCESSING state and reset them if not all services are completed
      const processingItems = activeQueue.filter(item => item.status === QueueItemStatus.PROCESSING);
      if (processingItems.length > 0) {
        queueDebugMonitor.log(`Found ${processingItems.length} items in PROCESSING state at launch`);
        for (const item of processingItems) {
          const allServicesCompleted = 
            item.directus?.status === ServiceStatus.COMPLETED &&
            item.eas?.status === ServiceStatus.COMPLETED &&
            item.linking?.status === ServiceStatus.COMPLETED;

          if (allServicesCompleted) {
            queueDebugMonitor.log(`Moving item ${item.localId} to completed queue as all services are completed`);
            await addToCompletedQueue(item);
            await removeFromActiveQueue(item.localId);
          } else {
            queueDebugMonitor.log(`Resetting item ${item.localId} to PENDING as not all services completed`);
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.PENDING,
              lastError: "Reset at launch - incomplete services",
              lastAttempt: undefined,
              directus: item.directus?.status === ServiceStatus.COMPLETED ? 
                item.directus : 
                { ...item.directus, status: ServiceStatus.INCOMPLETE },
              eas: item.eas?.status === ServiceStatus.COMPLETED ? 
                item.eas : 
                { ...item.eas, status: ServiceStatus.INCOMPLETE },
              linking: item.linking?.status === ServiceStatus.COMPLETED ? 
                item.linking : 
                { ...item.linking, status: ServiceStatus.INCOMPLETE }
            });
          }
        }
      }

      // Now check for stuck items (those that have exceeded the timeout threshold)
      const stuckItems = activeQueue.filter(item => {
        if (item.status === QueueItemStatus.PROCESSING && item.lastAttempt) {
          const timeSinceLastAttempt = Date.now() - new Date(item.lastAttempt).getTime();
          const isStuck = timeSinceLastAttempt > STUCK_PROCESSING_THRESHOLD;
          
          queueDebugMonitor.log(`\n┌─ Checking item ${item.localId} for stuck state ─┐`);
          queueDebugMonitor.log('├─ Status:', item.status);
          queueDebugMonitor.log('├─ Last Attempt:', item.lastAttempt);
          queueDebugMonitor.log('├─ Time Since:', `${timeSinceLastAttempt / 1000}s`);
          queueDebugMonitor.log('├─ Threshold:', `${STUCK_PROCESSING_THRESHOLD / 1000}s`);
          queueDebugMonitor.log('├─ Directus:', item.directus?.status || 'N/A');
          queueDebugMonitor.log('├─ EAS:', item.eas?.status || 'N/A');
          queueDebugMonitor.log('└─ Is Stuck:', isStuck);
          
          return isStuck;
        }
        return false;
      });
      
      if (stuckItems.length > 0) {
        queueDebugMonitor.log(`\n├─ Found ${stuckItems.length} stuck processing items:`);
        stuckItems.forEach(item => {
          queueDebugMonitor.log(`\n│  ┌─ Item ${item.localId}:`);
          queueDebugMonitor.log('│  ├─ Status:', item.status);
          queueDebugMonitor.log('│  ├─ Last Attempt:', item.lastAttempt);
          queueDebugMonitor.log('│  ├─ Directus:', item.directus?.status || 'N/A');
          queueDebugMonitor.log('│  ├─ EAS:', item.eas?.status || 'N/A');
          queueDebugMonitor.log('│  └─ Linking:', item.linking?.status || 'N/A');
        });
        await Promise.all(stuckItems.map(handleStuckProcessingItem));
      } else {
        queueDebugMonitor.log('└─ No stuck items found');
      }

      // Now proceed with processing the queue
      const itemsToProcessFiltered = itemsToProcess
        .filter((item: QueueItem) => 
          item.status !== QueueItemStatus.COMPLETED && 
          item.totalRetryCount < MAX_RETRIES &&
          !item.deleted // Skip deleted items
        )
        .sort((a: QueueItem, b: QueueItem) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first

      if (!itemsToProcessFiltered.length) {
        queueDebugMonitor.log("No items to process");
        return;
      }

      queueDebugMonitor.log(`=== Starting batch processing of ${itemsToProcessFiltered.length} items ===`);
      const requiredData = await fetchRequiredData();
      const collectors = await directusCollectors();
      const networkInfo = await NetInfo.fetch();
      // Fetch the last health check result
      const lastHealthCheck = await AsyncStorage.getItem('LAST_HEALTH_CHECK');
      const healthCheckResult = lastHealthCheck ? JSON.parse(lastHealthCheck) : null;
      const servicesHealthy = healthCheckResult?.result?.directus && healthCheckResult?.result?.eas;

      // Check network state before starting
      if (!networkInfo.isConnected || !networkInfo.isInternetReachable) {
        queueDebugMonitor.log("Network is offline, skipping queue processing");
        return;
      }

      // Check if wallet is needed but not available
      const requiresEAS = itemsToProcessFiltered.some(item => shouldProcessService(item.eas));
      if (requiresEAS && !wallet) {
        queueDebugMonitor.log("Wallet not ready, delaying queue processing requiring EAS.");
        return; // Don't process if EAS is needed but wallet is missing
      }

      // Process items sequentially
      for (const item of itemsToProcessFiltered) {
        try {
          // Check network state before processing each item
          const currentNetworkState = await NetInfo.fetch();
          if (!currentNetworkState.isConnected || !currentNetworkState.isInternetReachable) {
            queueDebugMonitor.log("Network is offline, stopping batch processing");
            break; // Exit the loop if network is offline
          }

          // Start processing timer
          currentProcessingItemId = item.localId;
          
          queueDebugMonitor.log(`=== Starting processing of item ${item.localId} ===`);
          queueDebugMonitor.log('Current state:', {
            directus: item.directus?.status,
            eas: item.eas?.status,
            linking: item.linking?.status,
            retryCount: item.totalRetryCount || 0,
            lastAttempt: item.lastAttempt
          });

          // First update to processing state
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.PROCESSING,
            lastAttempt: new Date().toISOString()
          });

          // Set processing timeout
          const timeoutPromise = new Promise((_, reject) => {
            currentProcessingTimeout = setTimeout(() => {
              queueDebugMonitor.log(`=== Processing timeout triggered for item ${item.localId} ===`);
              reject(new Error('Processing timeout'));
            }, PROCESSING_TIMEOUT);
          });

          // Process the item with timeout
          try {
            await Promise.race([
              processItem(item, requiredData, collectors, networkInfo, wallet),
              timeoutPromise
            ]);
            queueDebugMonitor.log(`=== Successfully completed processing item ${item.localId} ===`);
          } catch (error: any) {
            queueDebugMonitor.log(`=== Error processing item ${item.localId} ===`, {
              error: error?.message,
              type: error?.message === 'Processing timeout' ? 'TIMEOUT' : 'PROCESSING_ERROR'
            });
            if (error?.message === 'Processing timeout') {
              // Check if all services are completed
              const activeQueue = await getActiveQueue();
              const currentItem = activeQueue.find(i => i.localId === item.localId);
              
              if (currentItem) {
                const allServicesCompleted = 
                  currentItem.directus?.status === ServiceStatus.COMPLETED &&
                  currentItem.eas?.status === ServiceStatus.COMPLETED &&
                  currentItem.linking?.status === ServiceStatus.COMPLETED;

                if (!allServicesCompleted) {
                  queueDebugMonitor.log('└─ Not all services completed, resetting to PENDING');
                  await updateItemInCache(item.localId, {
                    status: QueueItemStatus.PENDING,
                    lastError: "Operation timed out",
                    lastAttempt: undefined,
                    directus: currentItem.directus?.status === ServiceStatus.COMPLETED ? 
                      currentItem.directus : 
                      { ...currentItem.directus, status: ServiceStatus.INCOMPLETE },
                    eas: currentItem.eas?.status === ServiceStatus.COMPLETED ? 
                      currentItem.eas : 
                      { ...currentItem.eas, status: ServiceStatus.INCOMPLETE },
                    linking: currentItem.linking?.status === ServiceStatus.COMPLETED ? 
                      currentItem.linking : 
                      { ...currentItem.linking, status: ServiceStatus.INCOMPLETE }
                  });
                } else {
                  queueDebugMonitor.log('└─ All services completed, keeping current state');
                }
              } else {
                queueDebugMonitor.log('└─ Item not found in active queue');
                // Reset the item if we can't find it
                await updateItemInCache(item.localId, {
                  status: QueueItemStatus.PENDING,
                  lastError: "Operation timed out",
                  lastAttempt: undefined
                });
              }
            }
            throw error;
          }
          // Clear timeout if it exists
          if (currentProcessingTimeout) {
            clearTimeout(currentProcessingTimeout);
            currentProcessingTimeout = null;
          }

          // Only log final state if item is still in active queue
          const activeQueue = await getActiveQueue();
          const finalItem = activeQueue.find(i => i.localId === item.localId);
          
          if (finalItem) {
            // Check if all services are completed
            const allServicesCompleted = 
              finalItem.directus?.status === ServiceStatus.COMPLETED &&
              finalItem.eas?.status === ServiceStatus.COMPLETED &&
              finalItem.linking?.status === ServiceStatus.COMPLETED;

            // Only increment retry count if services are not completed, not skipped, AND services were healthy
            if (!allServicesCompleted && !item.skipRetryIncrement && servicesHealthy) {
              await updateItemInCache(item.localId, {
                totalRetryCount: (finalItem.totalRetryCount || 0) + 1
              });
            }

            queueDebugMonitor.log(`\n┌─ Final state for item ${item.localId} ─┐`);
            queueDebugMonitor.log('├─ Status:', finalItem.status);
            queueDebugMonitor.log('├─ Directus:', finalItem.directus?.status || 'N/A');
            queueDebugMonitor.log('├─ EAS:', finalItem.eas?.status || 'N/A');
            queueDebugMonitor.log('├─ Linking:', finalItem.linking?.status || 'N/A');
            queueDebugMonitor.log('└─ Retry Count:', finalItem.totalRetryCount || 0);
          } else {
            queueDebugMonitor.log(`\n┌─ Item ${item.localId} moved to completed queue ─┐`);
            queueDebugMonitor.log('└─ All services completed successfully');
          }
        } catch (error) {
          queueDebugMonitor.error(`Error processing item ${item.localId}:`, error);
          try {
            // Update item with error and respect skipRetryIncrement flag AND service health
            await updateItemInCache(item.localId, {
              lastError: error instanceof Error ? error.message : "Unknown error",
              totalRetryCount: (!item.skipRetryIncrement && servicesHealthy) ?
                (item.totalRetryCount || 0) + 1 :
                (item.totalRetryCount || 0) // Keep current count if skipped or services unhealthy
            });
          } catch (cacheError) {
            queueDebugMonitor.error(`!!! Failed to update cache for item ${item.localId} after processing error:`, cacheError);
            // Even if cache update fails, we should try the next item
          }
          // Emit queue update event to refresh UI (might be slightly delayed if cache update failed)
          queueEventEmitter.emit(QueueEvents.UPDATED);
        } finally {
          currentProcessingItemId = null;
        }
      }

      queueDebugMonitor.log('=== Batch processing completed ===');
      // Set the last batch attempt time after all items have finished processing
      await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());
    } finally {
      isProcessing = false;
      processingPromise = null;
    }
  })();

  return processingPromise;
}

async function processItem(
  item: QueueItem,
  requiredData: RequiredData,
  collectors: Pick<DirectusCollector, "collector_id" | "collector_name" | "collector_identity">[],
  networkInfo: NetInfoState,
  wallet?: WalletInfo | null
) {
  queueDebugMonitor.log(`\n=== Processing item ${item.localId} ===`);
  queueDebugMonitor.log('Initial item state:', {
    status: item.status,
    totalRetryCount: item.totalRetryCount,
    directusStatus: item.directus?.status,
    easStatus: item.eas?.status,
    linkingStatus: item.linking?.status,
    directusEventId: item.directus?.eventId,
    easTxHash: item.eas?.txHash
  });

  // Check network state immediately
  const currentNetworkState = await NetInfo.fetch();
  if (!currentNetworkState.isConnected || !currentNetworkState.isInternetReachable) {
    queueDebugMonitor.log(`Network is offline, aborting processing of item ${item.localId}`);
    throw new Error('NETWORK_OFFLINE');
  }

  // Create an abort controller for the entire processing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROCESSING_TIMEOUT);

  // Set up network state monitoring
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (!state.isConnected || !state.isInternetReachable) {
      queueDebugMonitor.log(`Network disconnected during processing of item ${item.localId}`);
      controller.abort();
    }
  });

  try {
    // Create promises for both services to run in parallel
    const servicePromises = [];
    let directusResult: { eventId?: number; error?: any } = {};
    let easResult: { txHash?: string; error?: any } = {};

    // Process Directus if needed
    if (shouldProcessService(item.directus)) {
      const directusPromise = (async () => {
        try {
          const eventId = await createDirectusEvent(item, requiredData, collectors);
          // Store result, don't update cache here immediately
          directusResult = { eventId };
          return { eventId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          queueDebugMonitor.error(`Directus processing failed for item ${item.localId}:`, errorMessage);
          
          const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                               errorMessage.toLowerCase().includes('offline') ||
                               errorMessage.toLowerCase().includes('timeout') ||
                               errorMessage.toLowerCase().includes('connection');

          // Store error and network status
          directusResult = { error: { message: errorMessage, isNetworkError } };
          throw error; // Re-throw
        }
      })();
      servicePromises.push(directusPromise);
    }
    // No else needed, if not processed, directusResult remains {}

    // Process EAS if needed
    if (shouldProcessService(item.eas)) {
      const easPromise = (async () => {
        if (!wallet) {
           easResult = { error: { message: "Wallet not initialized", isNetworkError: false } };
           throw new Error("Wallet not initialized");
        }

        try {
          const easAttestationResult = await processEASAttestation(item, requiredData, wallet);
          // Store result, don't update cache here immediately
          easResult = { txHash: easAttestationResult.uid };
          return { txHash: easAttestationResult.uid };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          queueDebugMonitor.error(`EAS processing failed for item ${item.localId}:`, errorMessage);

          const isNetworkError = errorMessage === 'BLOCKCHAIN_OFFLINE' || 
                               errorMessage.toLowerCase().includes('network') ||
                               errorMessage.toLowerCase().includes('offline') ||
                               errorMessage.toLowerCase().includes('timeout') ||
                               errorMessage.toLowerCase().includes('connection');

          // Store error and network status
          easResult = { error: { message: errorMessage, isNetworkError } };
          throw error; // Re-throw
        }
      })();
      servicePromises.push(easPromise);
    }
    // No else needed, if not processed, easResult remains {}

    // Wait for all services to settle
    await Promise.allSettled(servicePromises);

    // Now, construct the update payload based on results and initial state
    let updatePayload: Partial<QueueItem> = {};
    let skipRetryIncrementUpdate = item.skipRetryIncrement || false; // Start with existing value

    // Determine Directus Update state
    if (shouldProcessService(item.directus)) { // Only construct update if it was processed
      if (directusResult.error) {
        updatePayload.directus = {
          ...(item.directus || {}), // Keep existing fields
          status: ServiceStatus.INCOMPLETE,
          error: directusResult.error.message
        };
        if (directusResult.error.isNetworkError) skipRetryIncrementUpdate = true;
      } else if (directusResult.eventId !== undefined) {
        updatePayload.directus = {
          ...(item.directus || {}), // Keep existing fields
          status: ServiceStatus.COMPLETED,
          eventId: directusResult.eventId,
          error: undefined // Clear previous error on success
        };
      }
       // If processing was attempted but result is empty (shouldn't happen?), retain old state?
       // For now, we assume error or eventId will be set if processed.
    } else {
       // If not processed, keep the original directus state (if any)
       updatePayload.directus = item.directus; 
    }

    // Determine EAS Update state
    if (shouldProcessService(item.eas)) { // Only construct update if it was processed
      if (easResult.error) {
        updatePayload.eas = {
          ...(item.eas || {}), // Keep existing fields
          status: ServiceStatus.INCOMPLETE,
          error: easResult.error.message
        };
        if (easResult.error.isNetworkError) skipRetryIncrementUpdate = true;
      } else if (easResult.txHash !== undefined) {
        updatePayload.eas = {
          ...(item.eas || {}), // Keep existing fields
          status: ServiceStatus.COMPLETED,
          txHash: easResult.txHash,
          error: undefined // Clear previous error on success
        };
      }
       // If processing was attempted but result is empty, retain old state?
    } else {
        // If not processed, keep the original eas state (if any)
        updatePayload.eas = item.eas;
    }

    // Add skipRetryIncrement to the payload
    updatePayload.skipRetryIncrement = skipRetryIncrementUpdate;

    // Only call update if there are actual changes to service states or skip flag
    if (Object.keys(updatePayload).length > 0) {
         await updateItemInCache(item.localId, updatePayload);
    }

    // Get current item state AFTER the potential combined update to check if we can link
    const activeQueue = await getActiveQueue();
    const currentItem = activeQueue.find(i => i.localId === item.localId);
    
    if (currentItem) {
      // Check if both Directus and EAS are completed AFTER the potential combined update
      if (currentItem.directus?.status === ServiceStatus.COMPLETED && 
          currentItem.eas?.status === ServiceStatus.COMPLETED &&
          currentItem.directus?.eventId && 
          currentItem.eas?.txHash) {
        
        // Only process linking if it's currently incomplete
        if (shouldProcessService(currentItem.linking)) {
            queueDebugMonitor.log(`Attempting linking for item ${item.localId}`);
            try {
            // Link EAS to Directus
            await linkEAStoDirectus(currentItem.directus.eventId, currentItem.eas.txHash);
            
            // Update linking status and potentially overall status to COMPLETED
            await updateItemInCache(item.localId, {
                linking: {
                 ...(currentItem.linking || {}), // Keep existing fields
                 status: ServiceStatus.COMPLETED,
                 error: undefined // Clear error on success
                },
                // Let updateItemInCache recalculate overall status
                lastAttempt: new Date().toISOString() // Update last attempt on final success step
            });

             // Re-fetch item to check final status after update
             const finalQueue = await getActiveQueue();
             const finalItem = finalQueue.find(i => i.localId === item.localId);
             // If after linking update, all are complete, move to completed queue
             if (finalItem && 
                 finalItem.directus?.status === ServiceStatus.COMPLETED &&
                 finalItem.eas?.status === ServiceStatus.COMPLETED &&
                 finalItem.linking?.status === ServiceStatus.COMPLETED) {
                await updateItemInCache(item.localId, {
                    status: QueueItemStatus.COMPLETED
                });
             }

            queueDebugMonitor.log(`Linking successful for item ${item.localId}`);
            } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            queueDebugMonitor.error(`Linking failed for item ${item.localId}:`, errorMessage);
            
            await updateItemInCache(item.localId, {
                linking: {
                 ...(currentItem.linking || {}), // Keep existing fields
                 status: ServiceStatus.INCOMPLETE,
                 error: errorMessage
                }
                // Overall status will be recalculated by updateItemInCache
            });
            // Do not throw error here, let the main error handler decide retry logic
            }
        } else {
             queueDebugMonitor.log(`Linking already completed for item ${item.localId}, skipping.`);
             // If linking was already done, ensure the item is marked COMPLETED if not already
             // This check might be redundant if getOverallStatus works correctly
             if (currentItem.status !== QueueItemStatus.COMPLETED && 
                 currentItem.directus?.status === ServiceStatus.COMPLETED &&
                 currentItem.eas?.status === ServiceStatus.COMPLETED &&
                 currentItem.linking?.status === ServiceStatus.COMPLETED) {
                 await updateItemInCache(item.localId, {
                    status: QueueItemStatus.COMPLETED,
                    lastAttempt: new Date().toISOString() 
                 });
             }
        }
      } else {
         queueDebugMonitor.log(`Cannot link item ${item.localId} yet. Directus: ${currentItem.directus?.status}, EAS: ${currentItem.eas?.status}`);
      }
    } else {
        // Item might have been completed and moved by the updateItemInCache call after services finished
        queueDebugMonitor.log(`Item ${item.localId} not found in active queue after service processing, likely completed.`);
    }

  } catch (error) {
    // This catch block now primarily catches errors from the setup (like network checks),
    // wallet initialization, or unhandled rejections from promises.
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    queueDebugMonitor.error(`Overall processing failed for item ${item.localId}:`, errorMessage);

    const isNetworkError = errorMessage === 'NETWORK_OFFLINE' || 
                          errorMessage === 'BLOCKCHAIN_OFFLINE' || 
                          errorMessage.toLowerCase().includes('network') ||
                          errorMessage.toLowerCase().includes('offline') ||
                          errorMessage.toLowerCase().includes('timeout') ||
                          errorMessage.toLowerCase().includes('connection');

    // Fetch the latest item state before deciding on failure status/retries
    // as some parts might have succeeded before the overall failure
    const latestQueue = await getActiveQueue();
    const latestItemState = latestQueue.find(i => i.localId === item.localId) || item; // Fallback to initial item if not found

    const currentRetryCount = latestItemState.totalRetryCount || 0;
    
    const lastHealthCheck = await AsyncStorage.getItem('LAST_HEALTH_CHECK');
    const healthCheckResult = lastHealthCheck ? JSON.parse(lastHealthCheck) : null;
    const servicesHealthy = healthCheckResult?.result?.directus && healthCheckResult?.result?.eas;
    
    // Use the skipRetryIncrement flag determined during the main processing logic
    const shouldIncrementRetry = !latestItemState.skipRetryIncrement && !isNetworkError && servicesHealthy;
    
    const newRetryCount = shouldIncrementRetry ? currentRetryCount + 1 : currentRetryCount;
    
    const newStatus = newRetryCount >= MAX_RETRIES ? 
      QueueItemStatus.FAILED : 
      QueueItemStatus.PENDING; // Reset to PENDING for retry unless max retries hit

    // Update item status based on error
    await updateItemInCache(item.localId, {
      status: newStatus,
      lastError: errorMessage,
      lastAttempt: new Date().toISOString(), // Record the time of this failed attempt
      // Preserve latest known service states
      directus: latestItemState.directus, 
      eas: latestItemState.eas,
      linking: latestItemState.linking,
      skipRetryIncrement: isNetworkError || latestItemState.skipRetryIncrement, 
      totalRetryCount: newRetryCount
    });
  } finally {
    // Clean up network listener and timeout
    clearTimeout(timeoutId);
    unsubscribe();
    // Reset processing state ONLY if this was the item being tracked
     if (currentProcessingItemId === item.localId) {
       currentProcessingItemId = null; 
       // Clear the shared timeout variable ONLY if it belongs to this item
       // This assumes PROCESSING_TIMEOUT is relatively short and overlaps are unlikely
       // A more robust solution might involve storing timeouts per-item
       if (currentProcessingTimeout) { 
          clearTimeout(currentProcessingTimeout);
          currentProcessingTimeout = null;
       }
     }
  }
}

async function createDirectusEvent(
  item: QueueItem,
  requiredData: RequiredData,
  collectors: Pick<DirectusCollector, "collector_id" | "collector_name" | "collector_identity">[]
): Promise<number> {
  // Format location
  const locationString = item.location?.coords
    ? `${item.location.coords.latitude},${item.location.coords.longitude}`
    : undefined;

  // Find collector
  let collectorName: string | undefined;
  if (item.collectorId && collectors) {
    const collector = collectors.find(
      (c) => c.collector_identity === item.collectorId
    );
    collectorName = collector?.collector_id?.toString();
  }

  // Create event
  const productId = item.manufacturing?.product ? parseInt(item.manufacturing.product, 10) : undefined;
  const eventData: Omit<MaterialTrackingEvent, 'event_id'> = {
    status: "draft",
    action: item.actionId,
    event_timestamp: new Date(item.date).toISOString(),
    event_location: locationString,
    collector_name: collectorName ? parseInt(collectorName, 10) : undefined,
    company: typeof requiredData.userData?.Company === 'number' ? requiredData.userData.Company : requiredData.userData?.Company?.id,
    manufactured_products: productId,
    Batch_quantity: item.manufacturing?.quantity ?? undefined,
    weight_per_item: item.manufacturing?.weightInKg?.toString() ?? undefined,
    event_input_id: [],
    event_output_id: [],
    EAS_UID: item.eas?.txHash,
  };

  const createdEvent = await createEvent(eventData);
  if (!createdEvent?.event_id) {
    throw new Error("No event ID returned from API");
  }

  // Process materials
  if (item.incomingMaterials?.length) {
    await Promise.all(item.incomingMaterials.map(async (material) => {
      if (!material || !createdEvent.event_id) return;
      const result = await createMaterialInput({
        input_Material: material.id,
        input_code: item.collectorId || material.code || "",
        input_weight: material.weight || 0,
        event_id: createdEvent.event_id,
      } as MaterialTrackingEventInput);

      if (!result) {
        throw new Error(`Failed to create input material for ${material.id}`);
      }
    }));
  }

  if (item.outgoingMaterials?.length) {
    await Promise.all(item.outgoingMaterials.map(async (material) => {
      if (!material || !createdEvent.event_id) return;
      const result = await createMaterialOutput({
        output_material: material.id,
        output_code: material.code || "",
        output_weight: material.weight || 0,
        event_id: createdEvent.event_id,
      } as MaterialTrackingEventOutput);

      if (!result) {
        throw new Error(`Failed to create output material for ${material.id}`);
      }
    }));
  }

  return createdEvent.event_id;
}

async function processDirectusService(
  item: QueueItem,
  requiredData: RequiredData,
  collectors: Pick<DirectusCollector, "collector_id" | "collector_name" | "collector_identity">[]
): Promise<{
  status: ServiceStatus;
  error?: string;
  eventId?: number;
  linked?: boolean;
}> {
  try {
    const eventId = await createDirectusEvent(item, requiredData, collectors);
    return {
      status: ServiceStatus.COMPLETED,
      eventId,
      linked: true
    };
  } catch (error) {
    return {
      status: ServiceStatus.INCOMPLETE,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processEASService(
  item: QueueItem,
  requiredData: RequiredData,
  wallet: WalletInfo
): Promise<{
  status: ServiceStatus;
  error?: string;
  txHash?: string;
}> {
  try {
    const result = await processEASAttestation(item, requiredData, wallet);
    return {
      status: ServiceStatus.COMPLETED,
      txHash: result.uid
    };
  } catch (error) {
    return {
      status: ServiceStatus.INCOMPLETE,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processLinkingService(
  item: QueueItem,
  eventId: number,
  easUid: string
): Promise<{
  status: ServiceStatus;
  error?: string;
}> {
  try {
    await linkEAStoDirectus(eventId, easUid);
    return {
      status: ServiceStatus.COMPLETED
    };
  } catch (error) {
    return {
      status: ServiceStatus.INCOMPLETE,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function processQueueItemsService(
  itemsToProcess: QueueItem[],
  wallet?: WalletInfo | null
) {
  if (!itemsToProcess?.length) {
    return;
  }

  // Check network state before starting
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    queueDebugMonitor.log("Network is offline, skipping queue processing");
    return;
  }

  // Process each item sequentially to maintain nonce order
  for (const item of itemsToProcess) {
    try {
      // Check network state before processing each item
      const currentNetworkState = await NetInfo.fetch();
      if (!currentNetworkState.isConnected || !currentNetworkState.isInternetReachable) {
        queueDebugMonitor.log("Network is offline, stopping batch processing");
        break; // Exit the loop if network is offline
      }

      // Fetch required data once for all services
      const requiredData = await fetchRequiredData();
      const collectors = await directusCollectors();
      const networkInfo = await NetInfo.fetch();

      // Process directus and eas services in parallel
      const [directusResult, easResult] = await Promise.all([
        processDirectusService(item, requiredData, collectors),
        processEASService(item, requiredData, wallet!)
      ]);

      // Update item with results from parallel processing
      await updateItemInCache(item.localId, {
        directus: directusResult,
        eas: easResult,
        lastAttempt: new Date().toISOString()
      });

      // Process linking service sequentially after parallel services complete
      if (directusResult.eventId && easResult.txHash) {
        const linkingResult = await processLinkingService(
          item,
          directusResult.eventId,
          easResult.txHash
        );

        // Update item with linking result
        await updateItemInCache(item.localId, {
          linking: linkingResult,
          lastAttempt: new Date().toISOString()
        });
      }

      // Emit queue update event to refresh UI
      queueEventEmitter.emit(QueueEvents.UPDATED);
    } catch (error) {
      console.error(`Error processing item ${item.localId}:`, error);
      // Continue with next item even if this one fails
      continue;
    }
  }
}

// Helper function to link EAS to Directus
async function linkEAStoDirectus(eventId: number, easUid: string): Promise<void> {
  try {
    const directusUpdatedEvent = await updateEvent(eventId, {
      EAS_UID: easUid,
    });

    if (!directusUpdatedEvent || !directusUpdatedEvent.event_id) {
      throw new Error('Failed to update EAS_UID in Directus');
    }

    // Verify the linking was successful
    const verifyEvent = await getEvent(eventId);
    if (!verifyEvent || verifyEvent[0]?.EAS_UID !== easUid) {
      throw new Error('Failed to verify EAS UID linking');
    }
  } catch (error) {
    throw new Error(`Failed to link EAS UID with Directus event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}