import * as Battery from "expo-battery";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { getQueueCacheKey } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { processQueueItems as processItems } from "@/services/queueProcessor";
import { ensureValidToken } from "@/utils/directus";

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
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 900, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background task registered");
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
    // Always process critical items
    if (item.status === QueueItemStatus.FAILED) {
      return true;
    }

    // Don't process on very low battery unless charging
    if (power.batteryLevel < 0.1 && !power.isCharging) {
      return false;
    }

    // Only process pending items on metered connection
    if (network.isMetered) {
      return item.status === QueueItemStatus.PENDING;
    }

    return true;
  }

  async processQueueItems(): Promise<BackgroundFetch.BackgroundFetchResult> {
    if (this.isProcessing) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    try {
      this.isProcessing = true;

      // Ensure we have a valid token before processing
      const token = await ensureValidToken();
      if (!token) {
        console.log(
          "No valid auth token available, deferring queue processing"
        );
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const [power, network] = await Promise.all([
        this.getPowerCondition(),
        this.getNetworkCondition(),
      ]);

      // Don't process if offline
      if (!network.isConnected) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const key = getQueueCacheKey();
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const items: QueueItem[] = JSON.parse(data);
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
      console.error("Background task failed:", error);
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
