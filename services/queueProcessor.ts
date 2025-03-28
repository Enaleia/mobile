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
  isCompletelyFailed
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
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { Company } from "@/types/company";
import { JsonRpcProvider } from "ethers";

let currentProcessingTimeout: NodeJS.Timeout | null = null;
let currentProcessingItemId: string | null = null;
let currentEASProvider: JsonRpcProvider | null = null;

// Helper function to handle retry count updates
function getUpdatedRetryCount(currentCount: number | undefined, updates: Partial<QueueItem>): number {
  // If explicitly setting the count, use that value
  if (typeof updates.totalRetryCount === 'number') {
    return updates.totalRetryCount;
  }
  // Otherwise preserve the current count
  return currentCount || 0;
}

async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  try {
    const items = await getActiveQueue();
    const updatedItems = items.map((item) =>
      item.localId === itemId
        ? {
            ...item,
            ...updates,
            // Use helper function for retry count
            totalRetryCount: getUpdatedRetryCount(item.totalRetryCount, updates),
            // Safely merge service states
            directus: updates.directus ? { 
              ...(item.directus || {}), 
              ...updates.directus 
            } : item.directus,
            eas: updates.eas ? { 
              ...(item.eas || {}), 
              ...updates.eas 
            } : item.eas,
            // Update overall status based on service states
            status: updates.status || getOverallStatus({
              ...item,
              directus: updates.directus ? { 
                ...(item.directus || {}), 
                ...updates.directus 
              } : item.directus,
              eas: updates.eas ? { 
                ...(item.eas || {}), 
                ...updates.eas 
              } : item.eas,
            }),
          }
        : item
    );

    // If item is completed or has exceeded max retries, move to completed queue
    const shouldComplete = (item: QueueItem) => 
      item.status === QueueItemStatus.COMPLETED || isCompletelyFailed(item);

    const itemToUpdate = updatedItems.find(item => item.localId === itemId);
    if (itemToUpdate && shouldComplete(itemToUpdate)) {
      await addToCompletedQueue(itemToUpdate);
      await removeFromActiveQueue(itemId);
    } else {
      await updateActiveQueue(updatedItems);
    }

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

let isProcessing = false;
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
      // If service was previously OFFLINE, update it back to PENDING
      if (item.eas?.status === ServiceStatus.OFFLINE) {
        await updateItemInCache(item.localId, {
          eas: {
            ...item.eas,
            status: ServiceStatus.PENDING,
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

  console.log(`Item ${item.localId} is stuck (exceeded ${PROCESSING_TIMEOUT/1000}s timeout):`, {
    lastAttempt: item.lastAttempt,
    timeSinceLastAttempt: item.lastAttempt ? `${(Date.now() - new Date(item.lastAttempt).getTime()) / 1000}s` : 'N/A',
    directusStatus: item.directus?.status,
    easStatus: item.eas?.status,
    totalRetryCount: item.totalRetryCount || 0
  });

  // If we've exceeded max retries, mark as completely failed
  if (item.totalRetryCount >= MAX_RETRIES) {
    await updateItemInCache(item.localId, {
      status: QueueItemStatus.FAILED,
      lastError: "Operation timed out and max retries exceeded",
      // Only update services that are still in PROCESSING state
      directus: item.directus?.status === ServiceStatus.PROCESSING ? {
        ...item.directus,
        status: ServiceStatus.FAILED,
        error: "Directus operation timed out"
      } : item.directus,
      eas: item.eas?.status === ServiceStatus.PROCESSING ? {
        ...item.eas,
        status: ServiceStatus.FAILED,
        error: "EAS operation timed out"
      } : item.eas
    });
  } else {
    // Otherwise, mark as failed but allow retry
    await updateItemInCache(item.localId, {
      status: QueueItemStatus.FAILED,
      lastError: "Operation timed out",
      // Only update services that are still in PROCESSING state
      directus: item.directus?.status === ServiceStatus.PROCESSING ? {
        ...item.directus,
        status: ServiceStatus.FAILED,
        error: "Directus operation timed out"
      } : item.directus,
      eas: item.eas?.status === ServiceStatus.PROCESSING ? {
        ...item.eas,
        status: ServiceStatus.FAILED,
        error: "EAS operation timed out"
      } : item.eas
    });
  }
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
        // Mark processing services as failed
        directus: currentItem.directus?.status === ServiceStatus.PROCESSING ? 
          { ...currentItem.directus, status: ServiceStatus.FAILED, error: "Operation cancelled" } : 
          currentItem.directus,
        eas: currentItem.eas?.status === ServiceStatus.PROCESSING ? 
          { ...currentItem.eas, status: ServiceStatus.FAILED, error: "Operation cancelled" } : 
          currentItem.eas
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

  // Set the last batch attempt time at the start of processing
  await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());

  // Filter out completed, failed, and completely failed items
  const itemsToProcessFiltered = itemsToProcess
    .filter((item: QueueItem) => 
      item.status !== QueueItemStatus.COMPLETED && 
      !isCompletelyFailed(item) &&
      (!isProcessing || item.localId === currentProcessingItemId)
    )
    .sort((a: QueueItem, b: QueueItem) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!itemsToProcessFiltered.length) {
    return;
  }

  if (isProcessing) {
    console.log("Already processing queue items");
    return;
  }

  isProcessing = true;

  try {
    const requiredData = await fetchRequiredData();
    const collectors = await directusCollectors();
    const networkInfo = await NetInfo.fetch();

    // Process items sequentially
    for (const item of itemsToProcessFiltered) {
      try {
        // Start processing timer
        currentProcessingItemId = item.localId;
        currentProcessingTimeout = setTimeout(async () => {
          console.log(`Processing timeout triggered for item ${item.localId}`);
          
          // Force reset all processing states
          isProcessing = false;
          currentProcessingTimeout = null;
          
          // Forcefully close any existing provider connection
          if (currentEASProvider) {
            try {
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
          
          // Get the current item state to evaluate service statuses
          const currentItem = (await getActiveQueue()).find(i => i.localId === item.localId);
          if (!currentItem) return;

          // Update item with evaluated statuses
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.FAILED,
            lastError: "Operation timed out",
            // Mark processing services as failed
            directus: currentItem.directus?.status === ServiceStatus.PROCESSING ? 
              { ...currentItem.directus, status: ServiceStatus.FAILED, error: "Operation timed out" } : 
              currentItem.directus,
            eas: currentItem.eas?.status === ServiceStatus.PROCESSING ? 
              { ...currentItem.eas, status: ServiceStatus.FAILED, error: "Operation timed out" } : 
              currentItem.eas
          }).catch(error => {
            console.error(`Error updating item ${item.localId} after timeout:`, error);
          });

          currentProcessingItemId = null;
        }, PROCESSING_TIMEOUT);

        console.log(`Starting processing for item ${item.localId}:`, {
          needsDirectus: Boolean(item.directus?.status !== ServiceStatus.COMPLETED),
          needsEAS: Boolean(item.eas?.status !== ServiceStatus.COMPLETED),
          totalRetryCount: item.totalRetryCount || 0
        });

        if (!item.directus?.status || !item.eas?.status) {
          console.log(`Item ${item.localId} already processed by both services, skipping`);
          continue;
        }

        // Process the item
        try {
          // Check network connectivity
          const isConnected = networkInfo.isConnected;
          if (!isConnected) {
            console.log("No network connection, marking item as offline");
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.OFFLINE,
              lastError: "No network connection",
            });
            continue;
          }

          // Get required data
          const { userData } = requiredData;

          console.log(`\n=== Processing item ${item.localId} ===`);
          console.log('Item state:', {
            status: item.status,
            totalRetryCount: item.totalRetryCount || 0,
            lastAttempt: item.lastAttempt,
            directusStatus: item.directus?.status,
            easStatus: item.eas?.status
          });

          // Check if item should be auto-retried
          if (!shouldAutoRetry(item)) {
            console.log(`Skipping item ${item.localId} - not eligible for auto-retry`);
            continue;
          }

          // Check if item is stuck
          if (isItemStuck(item)) {
            console.log(`Item ${item.localId} appears to be stuck, handling timeout...`);
            await handleStuckItem(item);
            continue;
          }

          let processingTimeout: NodeJS.Timeout | null = null;
          const needsDirectus = Boolean(item.directus?.status !== ServiceStatus.COMPLETED);
          const needsEAS = Boolean(item.eas?.status !== ServiceStatus.COMPLETED);

          try {
            // Start processing timer
            currentProcessingItemId = item.localId;
            currentProcessingTimeout = setTimeout(async () => {
              console.log(`Processing timeout triggered for item ${item.localId}`);
              
              // Force reset all processing states
              isProcessing = false;
              currentProcessingTimeout = null;
              
              // Forcefully close any existing provider connection
              if (currentEASProvider) {
                try {
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
              
              // Get the current item state to evaluate service statuses
              const currentItem = (await getActiveQueue()).find(i => i.localId === item.localId);
              if (!currentItem) return;

              // Update item with evaluated statuses
              await updateItemInCache(item.localId, {
                status: QueueItemStatus.FAILED,
                lastError: "Operation timed out",
                // Mark processing services as failed
                directus: currentItem.directus?.status === ServiceStatus.PROCESSING ? 
                  { ...currentItem.directus, status: ServiceStatus.FAILED, error: "Operation timed out" } : 
                  currentItem.directus,
                eas: currentItem.eas?.status === ServiceStatus.PROCESSING ? 
                  { ...currentItem.eas, status: ServiceStatus.FAILED, error: "Operation timed out" } : 
                  currentItem.eas
              }).catch(error => {
                console.error(`Error updating item ${item.localId} after timeout:`, error);
              });

              currentProcessingItemId = null;
            }, PROCESSING_TIMEOUT);

            console.log(`Starting processing for item ${item.localId}:`, {
              needsDirectus,
              needsEAS,
              totalRetryCount: item.totalRetryCount || 0
            });

            // Skip if no services need processing
            if (!needsDirectus && !needsEAS) {
              console.log(`Item ${item.localId} already processed by both services, skipping`);
              if (processingTimeout) clearTimeout(processingTimeout);
              continue;
            }

            // Update item to processing state, but only for services that need processing
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.PROCESSING,
              lastAttempt: new Date().toISOString(),
              directus: needsDirectus ? { status: ServiceStatus.PROCESSING } : item.directus,
              eas: needsEAS ? { status: ServiceStatus.PROCESSING } : item.eas,
            });

            let eventId: number | undefined;
            let easUid: string | undefined;

            let directusEvent: MaterialTrackingEvent | undefined;

            // Only process Directus if needed and not already completed
            if (needsDirectus && item.directus?.status !== ServiceStatus.COMPLETED) {
              try {
                console.log(`Processing Directus for item ${item.localId}`);
                
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

                // Process Directus
                const productId = item.manufacturing?.product ? parseInt(item.manufacturing.product, 10) : undefined;
                const eventData: Omit<MaterialTrackingEvent, 'event_id'> = {
                  status: "draft",
                  action: item.actionId,
                  event_timestamp: new Date(item.date).toISOString(),
                  event_location: locationString,
                  collector_name: collectorName ? parseInt(collectorName, 10) : undefined,
                  company: typeof userData?.Company === 'number' ? userData.Company : userData?.Company?.id,
                  manufactured_products: productId,
                  Batch_quantity: item.manufacturing?.quantity ?? undefined,
                  weight_per_item: item.manufacturing?.weightInKg?.toString() ?? undefined,
                  event_input_id: [],
                  event_output_id: [],
                  // If we already have an EAS UID from previous attempts, include it
                  EAS_UID: item.eas?.txHash,
                };

                // Log what we're sending
                console.log('=== Directus Event Creation Details ===');
                console.log('Raw product ID:', item.manufacturing?.product);
                console.log('Event data being sent to Directus:', JSON.stringify(eventData, null, 2));

                const createdEvent = await createEvent(eventData);
                console.log('Response from Directus:', JSON.stringify(createdEvent, null, 2));

                if (!createdEvent?.event_id) {
                  throw new Error("No event ID returned from API");
                }
                directusEvent = createdEvent as MaterialTrackingEvent;
                eventId = createdEvent.event_id;

                // Process materials sequentially
                if (item.incomingMaterials?.length) {
                  for (const material of item.incomingMaterials) {
                    if (!material || !directusEvent?.event_id) continue;
                    const result = await createMaterialInput({
                      input_Material: material.id,
                      input_code: item.collectorId || material.code || "",
                      input_weight: material.weight || 0,
                      event_id: directusEvent.event_id,
                    } as MaterialTrackingEventInput);

                    if (!result) {
                      throw new Error(
                        `Failed to create input material for ${material.id}`
                      );
                    }
                  }
                }

                if (item.outgoingMaterials?.length) {
                  const eventId = directusEvent?.event_id;
                  if (eventId) {
                    await Promise.all(
                      item.outgoingMaterials
                        .filter((m) => m)
                        .map(async (material) => {
                          const result = await createMaterialOutput({
                            output_material: material.id,
                            output_code: material.code || "",
                            output_weight: material.weight || 0,
                            event_id: eventId,
                          } as MaterialTrackingEventOutput);

                          if (!result) {
                            throw new Error(
                              `Failed to create output material for ${material.id}`
                            );
                          }
                        })
                    );
                  }
                }

                // Update item cache with Directus success and event ID
                await updateItemInCache(item.localId, {
                  directus: { 
                    status: ServiceStatus.COMPLETED,
                    eventId: eventId,
                  },
                });
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`Directus processing failed for item ${item.localId}:`, errorMessage);
                await updateItemInCache(item.localId, {
                  directus: { 
                    status: ServiceStatus.FAILED, 
                    error: errorMessage
                  },
                });
              }
            }

            // Only process EAS independently if needed and not already completed
            if (needsEAS && item.eas?.status !== ServiceStatus.COMPLETED) {
              if (!wallet) {
                const errorMessage = "Wallet not initialized";
                console.log(`EAS processing skipped for item ${item.localId}: ${errorMessage}`);
                await updateItemInCache(item.localId, {
                  eas: { 
                    status: ServiceStatus.FAILED, 
                    error: errorMessage
                  },
                });
                continue;
              }

              try {
                // Process EAS attestation
                const easResult = await processEASAttestation(item, requiredData, wallet);
                easUid = easResult.uid;

                // If we have both the event ID and EAS UID, update Directus
                if (eventId || item.directus?.eventId) {
                  const targetEventId = eventId || item.directus?.eventId;
                  if (targetEventId) {
                    try {
                      const directusUpdatedEvent = await updateEvent(targetEventId, {
                        EAS_UID: easResult.uid,
                      });

                      if (!directusUpdatedEvent || !directusUpdatedEvent.event_id) {
                        console.warn(`Failed to update EAS_UID in Directus for event ${targetEventId}`);
                        await updateItemInCache(item.localId, {
                          directus: { 
                            status: ServiceStatus.FAILED,
                            error: "Failed to link EAS UID with Directus event",
                            linked: false
                          }
                        });
                      } else {
                        // Verify the linking was successful
                        const verifyEvent = await getEvent(targetEventId);
                        if (verifyEvent && verifyEvent[0]?.EAS_UID === easResult.uid) {
                          await updateItemInCache(item.localId, {
                            directus: { 
                              status: ServiceStatus.COMPLETED,
                              linked: true
                            }
                          });
                        } else {
                          await updateItemInCache(item.localId, {
                            directus: { 
                              status: ServiceStatus.FAILED,
                              error: "Failed to verify EAS UID linking",
                              linked: false
                            }
                          });
                        }
                      }
                    } catch (error) {
                      console.error(`Failed to update EAS_UID in Directus for event ${targetEventId}:`, error);
                      await updateItemInCache(item.localId, {
                        directus: { 
                          status: ServiceStatus.FAILED,
                          error: "Failed to link EAS UID with Directus event",
                          linked: false
                        }
                      });
                    }
                  }
                }

                // Update EAS status to completed
                await updateItemInCache(item.localId, {
                  eas: {
                    status: ServiceStatus.COMPLETED,
                    error: undefined,
                    txHash: easResult.uid
                  },
                });
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                
                // Handle blockchain offline case
                if (errorMessage === 'BLOCKCHAIN_OFFLINE' || 
                    errorMessage.toLowerCase().includes('failed to detect network') || 
                    errorMessage.toLowerCase().includes('network error') ||
                    errorMessage.toLowerCase().includes('connection refused') ||
                    errorMessage.toLowerCase().includes('connection timeout') ||
                    errorMessage.toLowerCase().includes('network disconnected') ||
                    errorMessage.toLowerCase().includes('nobridge') ||
                    errorMessage.toLowerCase().includes('cannot start up')) {
                  console.log(`Blockchain network is offline for item ${item.localId}:`, errorMessage);
                  // Set blockchain service to OFFLINE without incrementing retry count
                  await updateItemInCache(item.localId, {
                    status: QueueItemStatus.PENDING,
                    eas: {
                      ...item.eas,
                      status: ServiceStatus.OFFLINE,
                      error: "Blockchain network is offline"
                    },
                    lastAttempt: undefined, // Clear last attempt to allow immediate retry when back online
                    totalRetryCount: item.totalRetryCount // Explicitly preserve the retry count
                  });
                  continue;
                }

                // Handle other errors
                console.error(`EAS processing failed for item ${item.localId}:`, errorMessage);
                await updateItemInCache(item.localId, {
                  eas: { 
                    status: ServiceStatus.FAILED, 
                    error: errorMessage
                  },
                });
              }
            }

            // Update final item status based on independent service states
            const updatedItem = (await getActiveQueue()).find(i => i.localId === item.localId);
            if (updatedItem?.directus?.status === ServiceStatus.COMPLETED && 
                updatedItem?.eas?.status === ServiceStatus.COMPLETED) {
              console.log(`Item ${item.localId} completed successfully`);
              await updateItemInCache(item.localId, {
                status: QueueItemStatus.COMPLETED,
              });
            } else if (updatedItem?.directus?.status === ServiceStatus.FAILED ||
                      updatedItem?.eas?.status === ServiceStatus.FAILED) {
              console.log(`Item ${item.localId} failed:`, {
                directus: updatedItem?.directus?.status,
                eas: updatedItem?.eas?.status,
                totalRetryCount: updatedItem?.totalRetryCount || 0
              });
              await updateItemInCache(item.localId, {
                status: QueueItemStatus.FAILED,
              });
            } else {
              console.log(`Item ${item.localId} still pending:`, {
                directus: updatedItem?.directus?.status,
                eas: updatedItem?.eas?.status,
                totalRetryCount: updatedItem?.totalRetryCount || 0
              });
              await updateItemInCache(item.localId, {
                status: QueueItemStatus.PENDING,
              });
            }

            // After processing each item, check if we should continue
            if (!isProcessing) {
              console.log("Processing interrupted, stopping queue processing");
              break;
            }

          } catch (error) {
            // Clear timeout and processing states on error
            if (currentProcessingTimeout) {
              clearTimeout(currentProcessingTimeout);
              currentProcessingTimeout = null;
            }
            if (currentEASProvider) {
              try {
                // @ts-ignore
                if (currentEASProvider._websocket) {
                  // @ts-ignore
                  currentEASProvider._websocket.terminate();
                }
              } catch (e) {
                console.log("Error closing provider on error:", e);
              }
              currentEASProvider = null;
            }
            currentProcessingItemId = null;
            isProcessing = false;
            throw error;
          }
        } catch (error) {
          console.error(`Error processing item ${item.localId}:`, error);
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.FAILED,
            lastError: error instanceof Error ? error.message : "Unknown error",
          });
        }
      } catch (error) {
        console.error(`Error processing item ${item.localId}:`, error);
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
          lastError: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // After all items are processed, update the last attempt time for the batch
    // This will be used to calculate the next retry time
    if (itemsToProcessFiltered.length > 0) {
      // Only set the last batch attempt time if we've processed all items
      const activeItems = await getActiveQueue();
      const hasPendingItems = activeItems.some(item => 
        item.status === QueueItemStatus.PENDING || 
        item.status === QueueItemStatus.PROCESSING
      );
      
      if (!hasPendingItems) {
        console.log("All items processed, setting last batch attempt time");
        await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());
      } else {
        console.log("Some items still pending, not setting last batch attempt time");
      }
    }

  } catch (error) {
    console.error("Error processing queue items:", error);
  } finally {
    isProcessing = false;
    if (currentEASProvider) {
      try {
        // @ts-ignore
        if (currentEASProvider._websocket) {
          // @ts-ignore
          currentEASProvider._websocket.terminate();
        }
      } catch (e) {
        console.log("Error closing provider in finally:", e);
      }
      currentEASProvider = null;
    }
  }
}