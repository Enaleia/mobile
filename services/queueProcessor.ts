import { createEvent } from "@/services/directus";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";

if (!process.env.EXPO_PUBLIC_CACHE_KEY) {
  throw new Error("EXPO_PUBLIC_CACHE_KEY is not set");
}

const MAX_RETRIES = 3;

/**
 * Updates the sync status of an item in the cache
 */
async function updateItemInCache(itemId: string, updates: Partial<QueueItem>) {
  const cacheKey = process.env.EXPO_PUBLIC_CACHE_KEY;
  if (!cacheKey) return;

  const data = await AsyncStorage.getItem(cacheKey);
  if (!data) return;

  const items: QueueItem[] = JSON.parse(data);
  const updatedItems = items.map((item) =>
    item.localId === itemId
      ? { ...item, ...updates, retryCount: (item.retryCount || 0) + 1 }
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
    trigger: null, // Show immediately
  });
}

export async function processQueueItems(itemsToProcess?: QueueItem[]) {
  const isConnected = (await NetInfo.fetch()).isConnected;
  if (!isConnected) {
    // Mark items as offline if no connection
    for (const item of itemsToProcess || []) {
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.OFFLINE,
      });
    }
    return false;
  }

  let hasProcessedItems = false;
  const items = itemsToProcess || [];

  if (items.length > 0) {
    await notifyUser(
      "Processing Queue",
      `Attempting to process ${items.length} items`
    );
  }

  for (const item of items) {
    try {
      // Skip items that have exceeded retry limit
      if (item.retryCount >= MAX_RETRIES) {
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
          lastError: "Max retry attempts exceeded",
        });
        continue;
      }

      // Update status to processing
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.PROCESSING,
        lastAttempt: new Date(),
      });

      try {
        // Attempt to process
        const directusEvent = await createEvent({
          action_name: item.type,
          event_timestamp: new Date(item.date),
        });
        console.log("Directus event created", directusEvent);
      } catch (error) {
        console.error("Error creating event", error);
        await updateItemInCache(item.localId, {
          status: QueueItemStatus.FAILED,
          lastError:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }

      // Mark as completed if successful
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.COMPLETED,
      });
      hasProcessedItems = true;
    } catch (error) {
      await updateItemInCache(item.localId, {
        status: QueueItemStatus.FAILED,
        lastError:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  return hasProcessedItems;
}
