import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { QueueEvents, queueEventEmitter } from "@/services/events";

const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    queueEventEmitter.emit(QueueEvents.UPDATED);

    const cacheKey = process.env.EXPO_PUBLIC_CACHE_KEY;
    if (!cacheKey) return BackgroundFetch.BackgroundFetchResult.NoData;

    const data = await AsyncStorage.getItem(cacheKey);
    if (!data) return BackgroundFetch.BackgroundFetchResult.NoData;

    const items: QueueItem[] = JSON.parse(data);
    const pendingItems = items.filter(
      (item) =>
        item.status === QueueItemStatus.PENDING ||
        item.status === QueueItemStatus.OFFLINE
    );

    return pendingItems.length > 0
      ? BackgroundFetch.BackgroundFetchResult.Failed
      : BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background sync failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundSync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // continue after app is closed
      startOnBoot: true, // start after device reboot
    });
    console.log("Background sync registered");
  } catch (error) {
    console.error("Task registration failed:", error);
  }
}
