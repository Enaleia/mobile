import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { processQueueItems } from "@/services/queueProcessor";

const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";

// Define the task before registering
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Process queue items here
    const result = await processQueueItems();
    // Since processQueueItems returns void, we'll assume any successful completion means new data
    return BackgroundFetch.BackgroundFetchResult.NewData;
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
