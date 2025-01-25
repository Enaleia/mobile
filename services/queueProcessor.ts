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

if (!process.env.EXPO_PUBLIC_CACHE_KEY) {
  throw new Error("EXPO_PUBLIC_CACHE_KEY is not set");
}

async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  const cacheKey = process.env.EXPO_PUBLIC_CACHE_KEY;
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

    if (!itemsToProcess) {
      const cacheKey = process.env.EXPO_PUBLIC_CACHE_KEY;
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

        const directusEvent = await createEvent({
          action: item.actionId,
          event_timestamp: new Date(item.date),
        });

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
                input_code: material.code || "",
                input_weight: material.weight || 0,
                event_id: directusEvent.event_id,
              });

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
                output_code: material.code || "",
                output_weight: material.weight || 0,
                event_id: directusEvent.event_id,
              });

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
