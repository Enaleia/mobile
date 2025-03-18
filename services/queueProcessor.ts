import {
  createEvent,
  createMaterialInput,
  createMaterialOutput,
  updateEvent,
} from "@/services/directus";
import { EASService } from "@/services/eas";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { BatchData } from "@/types/batch";
import { DirectusCollector } from "@/types/collector";
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
} from "@/types/queue";
import { EnaleiaUser } from "@/types/user";
import { WalletInfo } from "@/types/wallet";
import { getBatchData } from "@/utils/batchStorage";
import { ensureValidToken } from "@/utils/directus";
import { mapToEASSchema, validateEASSchema } from "@/utils/eas";
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

async function processEASAttestations(
  items: QueueItem[],
  requiredData: RequiredData,
  wallet: WalletInfo
): Promise<
  Map<string, { uid: string; network: "sepolia" | "optimism" } | Error>
> {
  const { userData, materials, products } = requiredData;
  const results = new Map<
    string,
    { uid: string; network: "sepolia" | "optimism" } | Error
  >();

  // Create EAS service once for all items
  const easService = new EASService(wallet.providerUrl, wallet.privateKey);

  // Process items sequentially
  for (const item of items) {
    try {
      // Map to EAS schema
      const collectors = await directusCollectors();
      const schema = mapToEASSchema(
        item,
        userData,
        materials,
        products,
        collectors
      );

      // Validate schema
      if (!validateEASSchema(schema)) {
        console.warn(`Invalid schema for item ${item.localId}`);
        results.set(item.localId, new Error("Invalid schema"));
        continue;
      }

      // Process single attestation
      const result = await easService.attest(schema);
      results.set(item.localId, result); // result already has { uid, network } shape

      // Add delay between items to ensure proper nonce sequencing
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing item ${item.localId}:`, error);
      results.set(
        item.localId,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  return results;
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

    // Process items one at a time
    for (const item of itemsToProcess || []) {
      try {
        // Skip if item is already completed
        if (item.status === QueueItemStatus.COMPLETED) {
          continue;
        }

        // Update item to processing state
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.PROCESSING,
          directus: { status: ServiceStatus.PROCESSING },
          eas: { status: ServiceStatus.PROCESSING },
          lastAttempt: new Date(),
        });

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

        // Process Directus first
        const directusEvent = await createEvent({
          action: item.actionId,
          event_timestamp: new Date(item.date).toISOString(),
          event_location: locationString,
          collector_name: collectorName,
          company: item.company,
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
          for (const material of item.outgoingMaterials) {
            if (!material) continue;
            const result = await createMaterialOutput({
              output_material: material.id,
              output_code: item.collectorId || material.code || "",
              output_weight: material.weight || 0,
              event_id: directusEvent.event_id,
            } as MaterialTrackingEventOutput);

            if (!result) {
              throw new Error(
                `Failed to create output material for ${material.id}`
              );
            }
          }
        }

        // Process EAS attestation
        const requiredData = await fetchRequiredData();
        const easResults = await processEASAttestations(
          [item],
          requiredData,
          wallet!
        );
        const easResult = easResults.get(item.localId);

        if (!easResult || easResult instanceof Error) {
          throw easResult || new Error("EAS attestation failed");
        }

        // Update Directus with EAS UID
        const directusUpdatedEvent = await updateEvent(directusEvent.event_id, {
          EAS_UID: easResult.uid,
        } as Partial<MaterialTrackingEvent>);

        if (!directusUpdatedEvent || !directusUpdatedEvent.event_id) {
          throw new Error("Update EAS_UID failed!");
        }

        // Mark item as completed
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.COMPLETED,
          directus: { status: ServiceStatus.COMPLETED },
          eas: {
            status: ServiceStatus.COMPLETED,
            txHash: easResult.uid,
            network: easResult.network,
          },
        });
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
