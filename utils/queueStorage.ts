import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import {
  getActiveQueueCacheKey,
  getCompletedQueueCacheKey,
} from "@/utils/storage";

interface CompletedQueueItem extends QueueItem {
  completedAt: string; // ISO string
}

export async function clearOldCache(): Promise<void> {
  const oldKey = process.env.EXPO_PUBLIC_QUEUE_CACHE_KEY;
  if (oldKey) {
    await AsyncStorage.removeItem(oldKey);
  }
}

export async function getActiveQueue(): Promise<QueueItem[]> {
  try {
    const queueData = await AsyncStorage.getItem(getActiveQueueCacheKey());
    if (!queueData) {
      return [];
    }
    const parsedData = JSON.parse(queueData);
    // Ensure we have a valid array of queue items
    if (!Array.isArray(parsedData)) {
      console.warn('Invalid queue data format, resetting to empty array');
      await AsyncStorage.setItem(getActiveQueueCacheKey(), JSON.stringify([]));
      return [];
    }
    // Filter out any invalid items
    return parsedData.filter((item): item is QueueItem => 
      item && 
      typeof item === 'object' && 
      typeof item.localId === 'string' &&
      typeof item.status === 'string'
    );
  } catch (error) {
    console.error('Error getting active queue:', error);
    return [];
  }
}

export async function getCompletedQueue(): Promise<QueueItem[]> {
  try {
    const queueData = await AsyncStorage.getItem(getCompletedQueueCacheKey());
    if (!queueData) {
      return [];
    }
    const parsedData = JSON.parse(queueData);
    // Ensure we have a valid array of queue items
    if (!Array.isArray(parsedData)) {
      console.warn('Invalid completed queue data format, resetting to empty array');
      await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify([]));
      return [];
    }
    // Filter out any invalid items
    return parsedData.filter((item): item is QueueItem => 
      item && 
      typeof item === 'object' && 
      typeof item.localId === 'string' &&
      typeof item.status === 'string'
    );
  } catch (error) {
    console.error('Error getting completed queue:', error);
    return [];
  }
}

export async function updateActiveQueue(items: QueueItem[]): Promise<void> {
  const key = getActiveQueueCacheKey();
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function addToCompletedQueue(item: QueueItem): Promise<void> {
  const key = getCompletedQueueCacheKey();
  const completed = await getCompletedQueue();
  const completedItem: CompletedQueueItem = {
    ...item,
    completedAt: new Date().toISOString(),
  };

  completed.push(completedItem);
  await AsyncStorage.setItem(key, JSON.stringify(completed));
}

export async function cleanupExpiredItems(): Promise<void> {
  const key = getCompletedQueueCacheKey();
  const completed = await getCompletedQueue();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const validItems = completed.filter(
    (item) => new Date(item.completedAt) > thirtyDaysAgo
  );

  if (validItems.length !== completed.length) {
    await AsyncStorage.setItem(key, JSON.stringify(validItems));
  }
}

export async function removeFromActiveQueue(localId: string): Promise<void> {
  const active = await getActiveQueue();
  const filtered = active.filter((item) => item.localId !== localId);
  await updateActiveQueue(filtered);
}

export async function removeFromAllQueues(localId: string): Promise<void> {
  // Remove from active queue
  const active = await getActiveQueue();
  const filteredActive = active.filter((item) => item.localId !== localId);
  await updateActiveQueue(filteredActive);

  // Remove from completed queue
  const completed = await getCompletedQueue();
  const filteredCompleted = completed.filter((item) => item.localId !== localId);
  await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify(filteredCompleted));
}

export type { CompletedQueueItem };
