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
import { getCacheKey, getQueueCacheKey } from "@/utils/storage";
import { DirectusCollector } from "@/types/collector";
import { BatchData } from "@/types/batch";

async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  const cacheKey = getQueueCacheKey();
  if (!cacheKey) return;

  const data = await AsyncStorage.getItem(cacheKey);
  if (!data) return;

  const items: QueueItem[] = JSON.parse(data);
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

  await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedItems));
  queueEventEmitter.emit(QueueEvents.UPDATED);
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
  if (isProcessing) {
    console.log("Queue processing already in progress, skipping");
    return;
  }

  try {
    isProcessing = true;
    const cacheKey = getCacheKey();

    const storedData = await AsyncStorage.getItem(cacheKey);

    let directusCollectors: DirectusCollector[] = [];
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
      const cacheKey = getQueueCacheKey();
      if (!cacheKey) return;

      const data = await AsyncStorage.getItem(cacheKey);
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
      console.log(
        `Processing item ${item.localId}, retry count: ${item.retryCount}`
      );

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

        await updateItemInCache(item.localId, {
          status: QueueItemStatus.COMPLETED,
        });

        console.log(`Successfully processed item ${item.localId}`);
      } catch (error) {
        console.error(`Error processing item ${item.localId}:`, error);

        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
          lastError:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  } finally {
    isProcessing = false;
  }
}
