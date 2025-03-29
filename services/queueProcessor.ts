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

let currentProcessingTimeout: NodeJS.Timeout | null = null;
let currentProcessingItemId: string | null = null;
let currentEASProvider: JsonRpcProvider | null = null;

let processingPromise: Promise<void> | null = null;
let isProcessing = false;

export async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  try {
    console.log(`=== Updating Item ${itemId} in Cache ===`);
    console.log('Updates:', updates);

    const items = await getActiveQueue();
    if (!items || !Array.isArray(items)) {
      console.warn('Invalid queue data, resetting to empty array');
      await updateActiveQueue([]);
      return;
    }

    const currentItem = items.find(item => item.localId === itemId);
    console.log('Current item state:', currentItem ? {
      status: currentItem.status,
      retries: currentItem.totalRetryCount,
      directus: currentItem.directus?.status,
      eas: currentItem.eas?.status,
      linking: currentItem.linking?.status
    } : 'Not found');

    const updatedItems = items.map((item) => {
      if (!item || typeof item !== 'object' || item.localId !== itemId) {
        return item;
      }

      // Create a safe update object with all required fields
      const safeUpdates: QueueItem = {
        ...item, // Keep all existing fields
        ...updates, // Apply updates
        // Ensure required fields are present
        localId: itemId,
        date: updates.date || item.date,
        // Track total retry count safely
        totalRetryCount: typeof updates.totalRetryCount === 'number' ? 
          updates.totalRetryCount : 
          (item.totalRetryCount || 0),
            // Safely merge service states
            directus: updates.directus ? { 
              ...(item.directus || {}), 
          ...updates.directus,
          status: updates.directus.status || ServiceStatus.INCOMPLETE
            } : item.directus,
            eas: updates.eas ? { 
              ...(item.eas || {}), 
          ...updates.eas,
          status: updates.eas.status || ServiceStatus.INCOMPLETE
            } : item.eas,
        linking: updates.linking ? {
          ...(item.linking || {}),
          ...updates.linking,
          status: updates.linking.status || ServiceStatus.INCOMPLETE
        } : item.linking
      };

            // Update overall status based on service states
      safeUpdates.status = getOverallStatus(safeUpdates);

      console.log('Updated item state:', {
        status: safeUpdates.status,
        retries: safeUpdates.totalRetryCount,
        directus: safeUpdates.directus?.status,
        eas: safeUpdates.eas?.status,
        linking: safeUpdates.linking?.status
      });

      return safeUpdates;
    });

    const itemToUpdate = updatedItems.find(item => item && item.localId === itemId);
    if (!itemToUpdate) {
      console.log(`Item ${itemId} not found in active queue`);
      return;
    }

    // Update the item in the appropriate queue based on its status
    if (itemToUpdate.status === QueueItemStatus.COMPLETED) {
      console.log(`Moving item ${itemId} to completed queue. Status:`, {
        status: itemToUpdate.status,
        directusStatus: itemToUpdate.directus?.status,
        easStatus: itemToUpdate.eas?.status,
        linkingStatus: itemToUpdate.linking?.status,
        totalRetries: itemToUpdate.totalRetryCount
      });
      await addToCompletedQueue(itemToUpdate);
      await removeFromActiveQueue(itemId);
    } else {
      console.log(`Updating item ${itemId} in active queue. Status:`, {
        status: itemToUpdate.status,
        directusStatus: itemToUpdate.directus?.status,
        easStatus: itemToUpdate.eas?.status,
        linkingStatus: itemToUpdate.linking?.status,
        totalRetries: itemToUpdate.totalRetryCount
      });
      await updateActiveQueue(updatedItems);
    }

    console.log('Emitting queue update event');
    queueEventEmitter.emit(QueueEvents.UPDATED);
  } catch (error) {
    console.error("Error updating item in cache:", error);
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
      console.log("Failed to get push token for push notification!");
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
    console.error("Error sending notification:", error);
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
      console.error("Error accessing batch data cache:", error);
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
        console.log(
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
        console.log(
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
    console.error("Error in fetchRequiredData:", error);
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
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_EAS_OPTIMISM_PROVIDER_URL);
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
  return Boolean(
    item.status === QueueItemStatus.PROCESSING &&
    item.lastAttempt &&
    Date.now() - new Date(item.lastAttempt).getTime() > PROCESSING_TIMEOUT
  );
}

async function handleStuckItem(item: QueueItem) {
  if (!isItemStuck(item)) return;

  console.log(`=== Handling stuck item ${item.localId} ===`, {
    lastAttempt: item.lastAttempt,
    timeSinceLastAttempt: item.lastAttempt ? `${(Date.now() - new Date(item.lastAttempt).getTime()) / 1000}s` : 'N/A',
    directusStatus: item.directus?.status,
    easStatus: item.eas?.status,
    eventId: item.directus?.eventId
  });

  // Kill any ongoing EAS provider connection
  if (currentEASProvider) {
    try {
      console.log('Terminating EAS provider connection');
      // @ts-ignore - _websocket exists but is not in type definitions
      if (currentEASProvider._websocket) {
        // @ts-ignore
        currentEASProvider._websocket.terminate();
      }
      currentEASProvider = null;
    } catch (error) {
      console.log("Error closing provider:", error);
    }
  }

  // Reset processing state
  currentProcessingItemId = null;

  // Update item state to allow retry
    await updateItemInCache(item.localId, {
    status: QueueItemStatus.PENDING,
      lastError: "Operation timed out",
    lastAttempt: undefined
  });

  console.log(`=== Reset stuck item ${item.localId} to PENDING ===`);
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
    console.log("Already processing queue items");
    return processingPromise;
  }

  processingPromise = (async () => {
    try {
      isProcessing = true;

      // Filter out completed items and items that have exceeded max retries
  const itemsToProcessFiltered = itemsToProcess
    .filter((item: QueueItem) => 
      item.status !== QueueItemStatus.COMPLETED && 
          item.totalRetryCount < MAX_RETRIES &&
          !item.deleted // Skip deleted items
    )
        .sort((a: QueueItem, b: QueueItem) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first

  if (!itemsToProcessFiltered.length) {
    return;
  }

      console.log(`=== Starting batch processing of ${itemsToProcessFiltered.length} items ===`);
    const requiredData = await fetchRequiredData();
    const collectors = await directusCollectors();
    const networkInfo = await NetInfo.fetch();

    // Process items sequentially
    for (const item of itemsToProcessFiltered) {
      try {
        // Start processing timer
        currentProcessingItemId = item.localId;
          
          console.log(`=== Starting processing of item ${item.localId} ===`);
          console.log('Current state:', {
            directus: item.directus?.status,
            eas: item.eas?.status,
            linking: item.linking?.status,
            retryCount: item.totalRetryCount || 0,
            eventId: item.directus?.eventId
          });

          // First update to processing state
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.PROCESSING,
            lastAttempt: new Date().toISOString()
          });

          // Set processing timeout
          const timeoutPromise = new Promise((_, reject) => {
            currentProcessingTimeout = setTimeout(() => {
              console.log(`=== Processing timeout triggered for item ${item.localId} ===`);
              reject(new Error('Processing timeout'));
            }, PROCESSING_TIMEOUT);
          });

          // Process the item with timeout
          try {
            await Promise.race([
              processItem(item, requiredData, collectors, networkInfo, wallet),
              timeoutPromise
            ]);
            console.log(`=== Successfully completed processing item ${item.localId} ===`);
          } catch (error: any) {
            console.log(`=== Error processing item ${item.localId} ===`, {
              error: error?.message,
              type: error?.message === 'Processing timeout' ? 'TIMEOUT' : 'PROCESSING_ERROR'
            });
            if (error?.message === 'Processing timeout') {
              // Kill processes and reset state
              await handleStuckItem(item);
            }
            throw error;
          } finally {
            // Clear timeout if it exists
            if (currentProcessingTimeout) {
              clearTimeout(currentProcessingTimeout);
              currentProcessingTimeout = null;
            }
            console.log(`=== Final state for item ${item.localId} ===`, {
              directus: item.directus?.status,
              eas: item.eas?.status,
              linking: item.linking?.status,
              retryCount: item.totalRetryCount || 0,
              eventId: item.directus?.eventId
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item.localId}:`, error);
          // Update item with error and increment retry count
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.FAILED,
            lastError: error instanceof Error ? error.message : "Unknown error",
            totalRetryCount: (item.totalRetryCount || 0) + 1
          });
          // Emit queue update event to refresh UI
          queueEventEmitter.emit(QueueEvents.UPDATED);
        } finally {
          currentProcessingItemId = null;
        }
      }

      console.log('=== Batch processing completed ===');
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
          console.log(`\n=== Processing item ${item.localId} ===`);
  console.log('Initial item state:', {
            status: item.status,
    totalRetryCount: item.totalRetryCount,
            directusStatus: item.directus?.status,
    easStatus: item.eas?.status,
    linkingStatus: item.linking?.status,
    directusEventId: item.directus?.eventId,
    easTxHash: item.eas?.txHash
  });

  // Process Directus if needed
  if (shouldProcessService(item.directus)) {
    try {
      // Process Directus
      const eventId = await processDirectusService(item, requiredData, collectors);
      
      // Mark Directus as completed
      await updateItemInCache(item.localId, {
        directus: { 
          status: ServiceStatus.COMPLETED,
          eventId: eventId
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Directus processing failed for item ${item.localId}:`, errorMessage);
      
      await updateItemInCache(item.localId, {
        directus: { 
          status: ServiceStatus.INCOMPLETE,
          error: errorMessage
        }
      });
    }
  }

  // Process EAS if needed
  if (shouldProcessService(item.eas)) {
    if (!wallet) {
      await updateItemInCache(item.localId, {
        eas: { 
          status: ServiceStatus.INCOMPLETE,
          error: "Wallet not initialized"
        }
      });
    } else {
      try {
        // Process EAS
        const easResult = await processEASAttestation(item, requiredData, wallet);
        
        // Mark EAS as completed
        await updateItemInCache(item.localId, {
          eas: { 
            status: ServiceStatus.COMPLETED,
            txHash: easResult.uid
          }
        });

        // Get the latest state after EAS update
        const updatedItems = await getActiveQueue();
        const updatedItem = updatedItems.find(i => i.localId === item.localId);
        
        if (!updatedItem) {
          throw new Error('Could not find updated item state');
        }

        // Process linking if both Directus and EAS are completed
        if (updatedItem.directus?.eventId && updatedItem.eas?.txHash) {
          try {
            console.log(`\n=== Processing linking service for item ${item.localId} ===`);
            console.log('Current state:', {
              directusEventId: updatedItem.directus.eventId,
              easUid: easResult.uid,
              directusStatus: updatedItem.directus.status,
              easStatus: updatedItem.eas.status,
              linkingStatus: updatedItem.linking?.status,
              directusEvent: updatedItem.directus,
              easEvent: updatedItem.eas,
              linkingEvent: updatedItem.linking
            });
            
            // Update the event with EAS UID
            console.log('Updating Directus event with EAS UID...');
            console.log('Update payload:', {
              eventId: updatedItem.directus.eventId,
              easUid: easResult.uid
            });
            
            const directusUpdatedEvent = await updateEvent(updatedItem.directus.eventId, {
              EAS_UID: easResult.uid,
            });

            console.log('Directus update response:', directusUpdatedEvent);

            if (!directusUpdatedEvent || !directusUpdatedEvent.event_id) {
              throw new Error('Failed to update EAS_UID in Directus');
            }

            // Verify the linking was successful
            console.log('Verifying EAS UID in Directus...');
            const verifyEvent = await getEvent(updatedItem.directus.eventId);
            console.log('Verification response:', verifyEvent);
            
            if (!verifyEvent || verifyEvent[0]?.EAS_UID !== easResult.uid) {
              console.error('Verification failed:', {
                verifyEvent,
                expectedUid: easResult.uid,
                actualUid: verifyEvent?.[0]?.EAS_UID
              });
              throw new Error('Failed to verify EAS UID linking');
            }

            console.log('Linking verification successful:', {
              eventId: updatedItem.directus.eventId,
              easUid: easResult.uid,
              directusEasUid: verifyEvent[0]?.EAS_UID
            });
            
            // Mark linking as completed
            console.log('Marking linking service as completed...');
              await updateItemInCache(item.localId, {
              linking: {
                status: ServiceStatus.COMPLETED
              }
            });

            // Wait a moment to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get the latest state after linking update
            const finalItems = await getActiveQueue();
            const finalItem = finalItems.find(i => i.localId === item.localId);

            if (!finalItem) {
              console.error('Could not find item after linking update');
              return;
            }

            console.log('Item state after linking completion:', {
              status: finalItem.status,
              directusStatus: finalItem.directus?.status,
              easStatus: finalItem.eas?.status,
              linkingStatus: finalItem.linking?.status,
              directusEventId: finalItem.directus?.eventId,
              easUid: finalItem.eas?.txHash
            });

            // Only update to completed if all services are completed
            if (finalItem.directus?.status === ServiceStatus.COMPLETED && 
                finalItem.eas?.status === ServiceStatus.COMPLETED && 
                finalItem.linking?.status === ServiceStatus.COMPLETED) {
              
              console.log('All services completed, updating item status...');
            await updateItemInCache(item.localId, {
                status: QueueItemStatus.COMPLETED
              });

              // Wait for status update
              await new Promise(resolve => setTimeout(resolve, 500));

              // Get final state before queue move
              const updatedItems = await getActiveQueue();
              const updatedItem = updatedItems.find(i => i.localId === item.localId);

              console.log('Final state before queue move:', {
                status: updatedItem?.status,
                directusStatus: updatedItem?.directus?.status,
                easStatus: updatedItem?.eas?.status,
                linkingStatus: updatedItem?.linking?.status
              });

              if (updatedItem?.status === QueueItemStatus.COMPLETED) {
                console.log('Moving completed item to completed queue');
                await addToCompletedQueue(updatedItem);
                await removeFromActiveQueue(item.localId);
              } else {
                console.log('Item not ready for completed queue:', {
                  status: updatedItem?.status,
                  directusStatus: updatedItem?.directus?.status,
                  easStatus: updatedItem?.eas?.status,
                  linkingStatus: updatedItem?.linking?.status
                });
              }
            } else {
              console.log('Not all services completed:', {
                directusStatus: finalItem.directus?.status,
                easStatus: finalItem.eas?.status,
                linkingStatus: finalItem.linking?.status
              });
            }
          } catch (linkError) {
            console.error(`Failed to link EAS UID to Directus:`, linkError);
            console.error('Error details:', {
              error: linkError instanceof Error ? linkError.message : 'Unknown error',
              stack: linkError instanceof Error ? linkError.stack : undefined,
              itemId: item.localId,
              directusEventId: updatedItem.directus?.eventId,
              easUid: easResult.uid
            });
            // Mark linking as incomplete
            await updateItemInCache(item.localId, {
              linking: {
                status: ServiceStatus.INCOMPLETE,
                error: `Failed to link EAS UID: ${linkError instanceof Error ? linkError.message : 'Unknown error'}`
              }
            });
          }
        } else {
          console.log('Cannot process linking - missing required data:', {
            hasDirectusEventId: !!updatedItem.directus?.eventId,
            hasEasTxHash: !!updatedItem.eas?.txHash,
            directusEventId: updatedItem.directus?.eventId,
            easTxHash: updatedItem.eas?.txHash,
            directusState: updatedItem.directus,
            easState: updatedItem.eas,
            linkingState: updatedItem.linking
          });
          // Mark linking as incomplete
          await updateItemInCache(item.localId, {
            linking: {
              status: ServiceStatus.INCOMPLETE,
              error: 'Missing required data for linking'
            }
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        if (errorMessage === 'BLOCKCHAIN_OFFLINE' || errorMessage.toLowerCase().includes('network')) {
          await updateItemInCache(item.localId, {
            eas: {
              status: ServiceStatus.INCOMPLETE,
              error: "Blockchain network is offline"
            }
          });
        } else {
          await updateItemInCache(item.localId, {
            eas: { 
              status: ServiceStatus.INCOMPLETE,
              error: errorMessage
            }
          });
        }
      }
    }
  }
}

// Helper function to process Directus service
async function processDirectusService(
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
    action: parseInt(item.actionId, 10),
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

function shouldComplete(item: QueueItem): boolean {
  // Check if all services are completed
  const allServicesCompleted = 
    item.directus?.status === ServiceStatus.COMPLETED &&
    item.eas?.status === ServiceStatus.COMPLETED &&
    item.linking?.status === ServiceStatus.COMPLETED;

  // Or if we've exceeded max retries
  const exceededMaxRetries = item.totalRetryCount >= MAX_RETRIES;

  console.log('Checking if item should complete:', {
    itemId: item.localId,
    allServicesCompleted,
    exceededMaxRetries,
    serviceStatuses: {
      directus: item.directus?.status,
      eas: item.eas?.status,
      linking: item.linking?.status
    },
    totalRetryCount: item.totalRetryCount,
    directusEventId: item.directus?.eventId,
    easTxHash: item.eas?.txHash,
    linkingStatus: item.linking?.status
  });

  return allServicesCompleted || exceededMaxRetries;
}