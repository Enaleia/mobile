import {
  createEvent,
  createMaterialInput,
  createMaterialOutput,
  updateEvent,
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
  console.log("processQueueItems called:", {
    itemCount: itemsToProcess?.length,
    isProcessing,
  });

  // Use a local processing flag instead of global
  const processingKey = `processing_${Date.now()}`;
  if (await AsyncStorage.getItem(processingKey)) {
    console.log("Queue processing already in progress, skipping");
    return;
  }

  try {
    await AsyncStorage.setItem(processingKey, "true");

    // Check if we can reach the API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("API URL not configured");
    }

    // Check wallet
    if (!wallet) {
      throw new Error("Wallet not initialized");
    }

    // Validate items before processing
    if (itemsToProcess) {
      for (const item of itemsToProcess) {
        // Validate weights
        const weights = [
          ...(item.incomingMaterials?.map((m) => m.weight) || []),
          ...(item.outgoingMaterials?.map((m) => m.weight) || []),
        ];
        if (weights.some((w) => w != null && (w < 0 || !isFinite(w)))) {
          throw new Error(`Invalid weight value in item ${item.localId}`);
        }

        // Validate dates
        if (new Date(item.date) > new Date()) {
          throw new Error(`Future date not allowed in item ${item.localId}`);
        }

        // Validate coordinates if present
        if (item.location?.coords) {
          const { latitude, longitude } = item.location.coords;
          if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            throw new Error(`Invalid coordinates in item ${item.localId}`);
          }
        }
      }
    }

    // Test API connection
    try {
      await fetch(apiUrl);
    } catch (error) {
      throw new Error(
        "Unable to reach server. Please check your internet connection."
      );
    }

    // Ensure we have a valid token before proceeding
    const validToken = await ensureValidToken();
    if (!validToken) {
      console.log("No valid token available, marking items as offline");
      if (itemsToProcess) {
        for (const item of itemsToProcess) {
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.OFFLINE,
            lastError: "Authentication required - please log in again",
          });
        }
      }
      return;
    }

    if (!itemsToProcess) {
      const allItems = await getActiveQueue();
      itemsToProcess = allItems.filter(
        (item) =>
          item.status === QueueItemStatus.PENDING ||
          item.status === QueueItemStatus.OFFLINE
      );
    }

    if (!itemsToProcess?.length) {
      console.log("No items to process");
      return;
    }

    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      console.log("No connection, marking items as offline");
      for (const item of itemsToProcess) {
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.OFFLINE,
        });
      }
      return;
    }

    // Process EAS attestation
    const requiredData = await fetchRequiredData();
    const { userData, materials, products } = requiredData;
    const company =
      typeof userData?.Company === "number"
        ? undefined
        : (userData?.Company as Pick<Company, "id" | "name" | "coordinates">);

    // Process items one at a time
    for (const item of itemsToProcess || []) {
      try {
        // Skip if item is already completed
        if (item.status === QueueItemStatus.COMPLETED) {
          continue;
        }

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
        // Get required data including userData
        const requiredData = await fetchRequiredData();
        const { userData } = requiredData;

        // Only process Directus if needed
        if (needsDirectus) {
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


          // Get company data from userData
          const company =
            typeof userData?.Company === "number"
              ? undefined
              : (userData?.Company as Pick<Company, "id" | "name" | "coordinates">);

          // Process Directus
          directusEvent = await createEvent({
            action: item.actionId,
            event_timestamp: new Date(item.date).toISOString(),
            event_location: locationString,
            collector_name: collectorName,
            company: company?.id,
            manufactured_products: item.manufacturing?.product ?? undefined,
            Batch_quantity: item.manufacturing?.quantity ?? undefined,
            weight_per_item:
              item.manufacturing?.weightInKg?.toString() ?? undefined,
          } as MaterialTrackingEvent);

          if (!directusEvent || !directusEvent.event_id) {
            throw new Error("No event ID returned from API");
          }


          // Process materials sequentially
          if (item.incomingMaterials?.length) {
            for (const material of item.incomingMaterials) {
              if (!material) continue;
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
            await Promise.all(
              item.outgoingMaterials
                .filter((m) => m)
                .map(async (material) => {
                  const result = await createMaterialOutput({
                    output_material: material.id,
                    output_code: material.code || "",
                    output_weight: material.weight || 0,
                    event_id: directusEvent.event_id,
                  } as MaterialTrackingEventOutput);

                  if (!result) {
                    throw new Error(
                      `Failed to create output material for ${material.id}`
                    );
                  }
                })
            );
          }

          // Update item cache with Directus success
          await updateItemInCache(item.localId, {
            directus: { status: ServiceStatus.COMPLETED },
          });
        }

        // Only process EAS if needed
        if (needsEAS) {
          // Process EAS attestation
          const easResult = await processEASAttestation(
            item,
            requiredData,
            wallet!
          );


          // If we have a new Directus event, update it with EAS UID
          if (directusEvent?.event_id) {
            const directusUpdatedEvent = await updateEvent(directusEvent.event_id, {
              EAS_UID: easResult.uid,
            } as Partial<MaterialTrackingEvent>);


            if (!directusUpdatedEvent || !directusUpdatedEvent.event_id) {
              throw new Error("Update EAS_UID failed!");
            }
          }

          // Update item cache with EAS success
          await updateItemInCache(item.localId, {
            eas: {
              status: ServiceStatus.COMPLETED,
              txHash: easResult.uid,
              network: easResult.network,
            },
          });
        }

        // Check if both services are now complete
        const updatedItem = (await getActiveQueue()).find(i => i.localId === item.localId);
        if (updatedItem?.directus?.status === ServiceStatus.COMPLETED && 
            updatedItem?.eas?.status === ServiceStatus.COMPLETED) {
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.COMPLETED,
          });
        } else if (updatedItem?.directus?.status === ServiceStatus.COMPLETED) {
          // If only Directus is complete, update the overall status to reflect this
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.PENDING,
            directus: { status: ServiceStatus.COMPLETED },
            eas: { status: ServiceStatus.PENDING },
          });
        }
      } catch (error) {
        console.error(`Error processing item ${item.localId}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await updateItemInCache(item.localId, {
          status:
            item.retryCount >= MAX_RETRIES
              ? QueueItemStatus.FAILED
              : QueueItemStatus.PENDING,
          directus: { status: ServiceStatus.FAILED, error: errorMessage },
          eas: { status: ServiceStatus.FAILED, error: errorMessage },
        });
      }

      // Add delay between items
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Error in processQueueItems:", error);
    throw error;
  } finally {
    await AsyncStorage.removeItem(processingKey);
    queueEventEmitter.emit(QueueEvents.UPDATED);
  }
}
