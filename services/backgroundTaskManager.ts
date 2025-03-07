import { QueueEvents, queueEventEmitter } from "@/services/events";
import { processQueueItems as processItems } from "@/services/queueProcessor";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { directus, ensureValidToken } from "@/utils/directus";
import { getActiveQueue } from "@/utils/queueStorage";
import NetInfo from "@react-native-community/netinfo";
import * as BackgroundFetch from "expo-background-fetch";
import * as Battery from "expo-battery";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

// Secure storage keys
const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_EXPIRY: "token_expiry",
  USER_EMAIL: "user_email",
  USER_PASSWORD: "user_password",
};

const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";
const LOW_BATTERY_THRESHOLD = 0.2; // 20%
const BATCH_SIZE = {
  OPTIMAL: 20, // When charging + WiFi
  NORMAL: 10, // Good conditions
  CONSERVATIVE: 5, // Low battery or cellular
  CRITICAL: 1, // Very low battery
};

interface NetworkCondition {
  isConnected: boolean;
  isWiFi: boolean;
  isMetered: boolean;
  strength?: number;
}

interface PowerCondition {
  batteryLevel: number;
  isCharging: boolean;
  isPowerSaveMode: boolean;
}

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private isProcessing = false;

  private constructor() {
    this.registerBackgroundTask();
  }

  static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  private async registerBackgroundTask() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK
      );
      console.log("Is background task registered:", isRegistered);

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 900, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background task registered successfully");

      // Add this to verify the registration worked
      const tasks = await TaskManager.getRegisteredTasksAsync();
      console.log("Registered tasks:", JSON.stringify(tasks, null, 2));
    } catch (error) {
      console.error("Failed to register background task:", error);
    }
  }

  private async getPowerCondition(): Promise<PowerCondition> {
    const [batteryLevel, chargingState, powerMode] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.getBatteryStateAsync(),
      Battery.getPowerStateAsync(),
    ]);

    return {
      batteryLevel,
      isCharging:
        chargingState === Battery.BatteryState.CHARGING ||
        chargingState === Battery.BatteryState.FULL,
      isPowerSaveMode: powerMode.lowPowerMode,
    };
  }

  private async getNetworkCondition(): Promise<NetworkCondition> {
    const state = await NetInfo.fetch();

    // Safe type casting since we check isConnected
    const details = state.isConnected ? (state.details as any) : null;

    return {
      isConnected: !!state.isConnected,
      isWiFi: state.type === "wifi",
      isMetered: state.type === "cellular",
      strength: details?.strength,
    };
  }

  private getBatchSize(
    power: PowerCondition,
    network: NetworkCondition
  ): number {
    if (power.isCharging && network.isWiFi) {
      return BATCH_SIZE.OPTIMAL;
    }

    if (power.batteryLevel < LOW_BATTERY_THRESHOLD) {
      return BATCH_SIZE.CRITICAL;
    }

    if (network.isMetered || power.isPowerSaveMode) {
      return BATCH_SIZE.CONSERVATIVE;
    }

    return BATCH_SIZE.NORMAL;
  }

  private shouldProcessItem(
    item: QueueItem,
    power: PowerCondition,
    network: NetworkCondition
  ): boolean {
    // Never process completed items
    if (item.status === QueueItemStatus.COMPLETED) {
      return false;
    }

    // Always process failed items
    if (item.status === QueueItemStatus.FAILED) {
      return true;
    }

    // Don't process items that were attempted recently (30 seconds)
    if (
      item.lastAttempt &&
      new Date(item.lastAttempt).getTime() > Date.now() - 30000
    ) {
      return false;
    }

    // Don't process on very low battery unless charging
    if (power.batteryLevel < 0.1 && !power.isCharging) {
      return false;
    }

    // Only process pending items on metered connection
    if (network.isMetered) {
      return item.status === QueueItemStatus.PENDING;
    }

    // Only process pending or offline items
    return (
      item.status === QueueItemStatus.PENDING ||
      item.status === QueueItemStatus.OFFLINE
    );
  }

  private async reauthorizeWithStoredCredentials(): Promise<boolean> {
    try {
      const email = await SecureStore.getItemAsync("user_email");
      const password = await SecureStore.getItemAsync("user_password");

      if (!email || !password) {
        console.log("No stored credentials found for reauthorization");
        return false;
      }

      const loginResult = await directus.login(email, password);
      if (!loginResult.access_token) return false;

      // Store the new tokens and expiry
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.AUTH_TOKEN,
        loginResult.access_token
      );

      // Set expiry using the actual expiry value from login result
      const expiryDate = loginResult.expires_at
        ? new Date(loginResult.expires_at)
        : loginResult.expires
        ? new Date(loginResult.expires)
        : new Date(Date.now() + 24 * 24 * 60 * 60 * 1000); // Fallback to 24 days

      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.TOKEN_EXPIRY,
        expiryDate.toISOString()
      );

      if (loginResult.refresh_token) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.REFRESH_TOKEN,
          loginResult.refresh_token
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to reauthorize with stored credentials:", error);
      return false;
    }
  }

  async processQueueItems(): Promise<BackgroundFetch.BackgroundFetchResult> {
    if (this.isProcessing) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    try {
      this.isProcessing = true;

      // Try to get a valid token, if not, try to reauthorize
      const token = await ensureValidToken();
      if (!token) {
        console.log("No valid token, attempting reauthorization");
        const reauthorized = await this.reauthorizeWithStoredCredentials();
        if (!reauthorized) {
          console.log("Reauthorization failed, deferring queue processing");
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
      }

      const [power, network] = await Promise.all([
        this.getPowerCondition(),
        this.getNetworkCondition(),
      ]);

      // Don't process if offline
      if (!network.isConnected) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const items = await getActiveQueue();
      if (!items.length) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const itemsToProcess = items.filter((item) =>
        this.shouldProcessItem(item, power, network)
      );

      if (itemsToProcess.length === 0) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const batchSize = this.getBatchSize(power, network);
      console.log(
        `Processing queue with batch size ${batchSize}`,
        `Power: ${JSON.stringify(power)}`,
        `Network: ${JSON.stringify(network)}`
      );

      // Group items by type for batch processing
      const groupedItems = itemsToProcess.reduce((acc, item) => {
        const key = `${item.actionId}-${item.company || "no-company"}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, QueueItem[]>);

      // Process each group in batches
      for (const group of Object.values(groupedItems)) {
        // Process items in batches of batchSize
        for (let i = 0; i < group.length; i += batchSize) {
          const batch = group.slice(i, i + batchSize);
          console.log(`Processing batch of ${batch.length} items`);
          await processItems(batch);
        }
      }

      // Notify that processing is complete
      queueEventEmitter.emit(QueueEvents.UPDATED);

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error("Error processing queue items:", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    } finally {
      this.isProcessing = false;
    }
  }
}

// Define the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const manager = BackgroundTaskManager.getInstance();
  return await manager.processQueueItems();
});
