import {
  MaterialTrackingEvent,
  MaterialTrackingEventInput,
  MaterialTrackingEventOutput,
} from "@/types/event";
import {
  createEvent,
  createMaterialInput,
  createMaterialOutput,
} from "@/services/directus";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { MAX_RETRIES, QueueItem, QueueItemStatus } from "@/types/queue";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { getBatchCacheKey } from "@/utils/storage";
import { DirectusCollector } from "@/types/collector";
import { BatchData } from "@/types/batch";
import { ensureValidToken } from "@/utils/directus";
import Constants from "expo-constants";
import { directus } from "@/utils/directus";
import {
  getActiveQueue,
  updateActiveQueue,
  addToCompletedQueue,
  removeFromActiveQueue,
} from "@/utils/queueStorage";

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
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null,
  });
}

let isProcessing = false;

export async function processQueueItems(itemsToProcess?: QueueItem[]) {
  console.log("processQueueItems called:", {
    itemCount: itemsToProcess?.length,
    isProcessing,
  });

  if (isProcessing) {
    console.log("Queue processing already in progress, skipping");
    return;
  }

  try {
    isProcessing = true;

    // Check if we can reach the API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      console.log("API URL not configured");
      if (itemsToProcess) {
        for (const item of itemsToProcess) {
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.OFFLINE,
            lastError: "API URL not configured",
          });
        }
      }
      return;
    }

    // Test API connection
    try {
      await fetch(apiUrl);
    } catch (error) {
      console.log("Cannot reach API, marking items as offline");
      if (itemsToProcess) {
        for (const item of itemsToProcess) {
          await updateItemInCache(item.localId, {
            status: QueueItemStatus.OFFLINE,
            lastError: "Cannot reach API - please check your connection",
          });
        }
      }
      return;
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

    const cacheKey = getBatchCacheKey();

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
        ).find((query: any) => query?.queryKey?.includes("batchData")) as
          | { state: { data: BatchData } }
          | undefined;

        if (batchDataQuery) {
          directusCollectors = batchDataQuery.state?.data?.collectors || [];
        }
      } catch (error) {
        console.error("Error accessing cache data:", error);
      }
    }

    if (!itemsToProcess) {
      const queueKey = getBatchCacheKey();
      if (!queueKey) return;

      const data = await AsyncStorage.getItem(queueKey);
      if (!data) return;

      const allItems: QueueItem[] = JSON.parse(data);
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

    for (const item of itemsToProcess) {
      console.log(`Starting to process item ${item.localId}`);

      try {
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.PROCESSING,
          lastAttempt: new Date(),
        });

        // Format location as "latitude,longitude" if available
        const locationString = item.location?.coords
          ? `${item.location.coords.latitude},${item.location.coords.longitude}`
          : undefined;

        // Find db collector_id if this is a collection action and we have a collector QR ID
        let collectorDbId: number | undefined;
        if (item.collectorId && directusCollectors) {
          console.log({ collectors: directusCollectors.length });
          const collector = directusCollectors.find(
            (c) => c.collector_identity === item.collectorId
          );
          if (collector) {
            collectorDbId = collector.collector_id;
            console.log({ collector });
          } else {
            console.warn(`No collector found for ID: ${item.collectorId}`);
          }
        }

        console.log({ collectorDbId });

        const directusEvent = await createEvent({
          action: item.actionId,
          event_timestamp: new Date(item.date).toISOString(),
          event_location: locationString,
          collector_name: collectorDbId,
          company: item.company,
          manufactured_products: item.manufacturing?.product ?? undefined,
          Batch_quantity: item.manufacturing?.quantity ?? undefined,
          weight_per_item:
            item.manufacturing?.weightInKg?.toString() ?? undefined,
        } as MaterialTrackingEvent);

        console.log("directusEvent", JSON.stringify(directusEvent, null, 2));

        if (!directusEvent || !directusEvent.event_id) {
          throw new Error("No event ID returned from API");
        }

        if (item.incomingMaterials?.length) {
          const validMaterials = item.incomingMaterials.filter(
            (material) => material
          );

          await Promise.all(
            validMaterials.map(async (material) => {
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

              console.log(
                `Created incoming material record for ${material.id}`
              );
            })
          );
        }

        if (item.outgoingMaterials?.length) {
          const validMaterials = item.outgoingMaterials.filter(
            (material) => material
          );

          await Promise.all(
            validMaterials.map(async (material) => {
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

              console.log(
                `Created outgoing material record for ${material.id}`
              );
            })
          );
        }

        console.log(`Successfully processed item ${item.localId}`);
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.COMPLETED,
        });
      } catch (error) {
        console.error(`Error processing item ${item.localId}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
          lastError: errorMessage,
        });

        // Throw the error to be caught by the caller
        throw error;
      }
    }
  } finally {
    isProcessing = false;
    queueEventEmitter.emit(QueueEvents.UPDATED);
  }
}
