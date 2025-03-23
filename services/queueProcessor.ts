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

async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  try {
    const items = await getActiveQueue();
    const updatedItems = items.map((item) =>
      item.localId === itemId
        ? {
            ...item,
            ...updates,
            retryCount:
              updates.status === QueueItemStatus.PROCESSING
                ? (item.retryCount || 0) + 1
                : item.retryCount,
            // Properly merge service states
            directus: updates.directus
              ? { ...item.directus, ...updates.directus }
              : item.directus,
            eas: updates.eas ? { ...item.eas, ...updates.eas } : item.eas,
            // Update overall status based on service states
            status: updates.status || getOverallStatus({
              ...item,
              directus: updates.directus
                ? { ...item.directus, ...updates.directus }
                : item.directus,
              eas: updates.eas 
                ? { ...item.eas, ...updates.eas }
                : item.eas,
            }),
          }
        : item
    );

    // If item is completed, move it to completed queue
    if (updates.status === QueueItemStatus.COMPLETED) {
      const completedItem = updatedItems.find(
        (item) => item.localId === itemId
      );
      if (completedItem) {
        await addToCompletedQueue(completedItem);
        await removeFromActiveQueue(itemId);
      }
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
): Promise<{ uid: string; network: "sepolia" | "optimism" }> {
  const { userData, materials, products } = requiredData;
  const easService = new EASService(wallet.providerUrl, wallet.privateKey);

  try {
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
    if (!result?.uid || !result?.network) {
      throw new Error("Invalid attestation result");
    }

    return result;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function processQueueItems(
  itemsToProcess?: QueueItem[],
  wallet?: WalletInfo | null
) {
  if (!itemsToProcess?.length) {
    console.log("No items to process");
    return;
  }

  // Check network connectivity
  const isConnected = (await NetInfo.fetch()).isConnected;
  if (!isConnected) {
    console.log("No network connection, marking items as offline");
    for (const item of itemsToProcess) {
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.OFFLINE,
        lastError: "No network connection",
      });
    }
    return;
  }

  // Get required data
  const requiredData = await fetchRequiredData();
  const { userData } = requiredData;

  // Process items sequentially
  for (const item of itemsToProcess) {
    console.log(`Processing item ${item.localId}:`, {
      directusStatus: item.directus?.status,
      easStatus: item.eas?.status,
    });

    let eventId: number | undefined;
    let easUid: string | undefined;

    // Check if Directus was already successful
    const needsDirectus = item.directus?.status !== ServiceStatus.COMPLETED;
    const needsEAS = item.eas?.status !== ServiceStatus.COMPLETED;

    if (!needsDirectus && !needsEAS) {
      console.log(`Item ${item.localId} already processed by both services, skipping`);
      continue;
    }

    // Update item to processing state
    await updateItemInCache(item.localId, {
      status: QueueItemStatus.PROCESSING,
      directus: needsDirectus ? { status: ServiceStatus.PROCESSING } : item.directus,
      eas: needsEAS ? { status: ServiceStatus.PROCESSING } : item.eas,
      lastAttempt: new Date(),
    });

    let directusEvent: MaterialTrackingEvent | undefined;

    // Only process Directus if needed
    if (needsDirectus) {
      try {
        console.log(`Processing Directus for item ${item.localId}`);
        
        // Format location
        const locationString = item.location?.coords
          ? `${item.location.coords.latitude},${item.location.coords.longitude}`
          : undefined;

        // Find collector
        const collectors = await directusCollectors();
        let collectorName: string | undefined;
        if (item.collectorId && collectors) {
          const collector = collectors.find(
            (c) => c.collector_identity === item.collectorId
          );
          collectorName = collector?.collector_id?.toString();
        }

        // Process Directus
        const eventData: Omit<MaterialTrackingEvent, 'event_id'> = {
          status: "draft",
          action: item.actionId,
          event_timestamp: new Date(item.date).toISOString(),
          event_location: locationString,
          collector_name: collectorName ? parseInt(collectorName, 10) : undefined,
          company: typeof userData?.Company === 'number' ? userData.Company : userData?.Company?.id,
          manufactured_products: item.manufacturing?.product,
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

    // Process EAS independently if needed
    if (needsEAS) {
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

        await updateItemInCache(item.localId, {
          eas: {
            status: ServiceStatus.COMPLETED,
            error: undefined,
            txHash: easResult.uid,
            network: easResult.network,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`EAS processing failed for item ${item.localId}:`, errorMessage);
        await updateItemInCache(item.localId, {
          eas: { 
            status: ServiceStatus.FAILED, 
            error: errorMessage
          },
        });
      }
    }

    // Update final item status
    const updatedItem = (await getActiveQueue()).find(i => i.localId === item.localId);
    if (updatedItem?.directus?.status === ServiceStatus.COMPLETED && 
        updatedItem?.eas?.status === ServiceStatus.COMPLETED) {
      console.log(`Item ${item.localId} completed successfully`);
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.COMPLETED,
      });
    } else {
      if (updatedItem?.directus?.status === ServiceStatus.FAILED ||
          updatedItem?.eas?.status === ServiceStatus.FAILED) {
        console.log(`Item ${item.localId} failed:`, {
          directus: updatedItem?.directus?.status,
          eas: updatedItem?.eas?.status,
        });
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
        });
      } else {
        console.log(`Item ${item.localId} still pending:`, {
          directus: updatedItem?.directus?.status,
          eas: updatedItem?.eas?.status,
        });
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.PENDING,
        });
      }
    }
  }
}