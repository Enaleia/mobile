import { EventFormType } from "@/app/attest/new/[slug]";

export const PROCESSING_TIMEOUT = 30 * 1000;  // 30 seconds per attempt
export const MAX_RETRIES_PER_BATCH = 3;       // 3 attempts in initial phase
export const RETRY_COOLDOWN = 20 * 60 * 1000; // 20 minutes between retries in slow mode
export const MAX_RETRY_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days maximum retry window
export const RETRY_INTERVALS = [2000, 5000, 10000]; // Retry intervals in milliseconds for initial phase

export enum QueueItemStatus {
  "PENDING" = "PENDING",
  "PROCESSING" = "PROCESSING",
  "COMPLETED" = "COMPLETED",
  "FAILED" = "FAILED",
  "OFFLINE" = "OFFLINE",
  "SLOW_RETRY" = "SLOW_RETRY"
}

export enum ServiceStatus {
  "PENDING" = "PENDING",
  "PROCESSING" = "PROCESSING",
  "OFFLINE" = "OFFLINE",
  "FAILED" = "FAILED",
  "COMPLETED" = "COMPLETED",
}

export interface ServiceState {
  status: ServiceStatus;
  error?: string;
  lastAttempt?: Date;
  eventId?: number;
  linked?: boolean; // Whether the EAS UID is linked with the Directus event
}

export interface QueueItem extends Omit<EventFormType, "type"> {
  localId: string;
  status: QueueItemStatus;
  retryCount: number;
  lastAttempt?: Date;
  lastError?: string;
  company?: number;
  actionId: number;
  actionName: string;
  initialRetryCount?: number;     // Count of retries in initial phase
  slowRetryCount?: number;        // Count of retries in slow mode
  enteredSlowModeAt?: Date;      // When the item entered slow retry mode

  // Service-specific states
  directus: ServiceState;
  eas: ServiceState & {
    txHash?: string;
    verified?: boolean;
  };
}

export const MAX_RETRIES = 3;

// Helper to determine overall status
export function getOverallStatus(item: QueueItem): QueueItemStatus {
  // If either service is processing, show processing
  if (
    item.directus.status === ServiceStatus.PROCESSING ||
    item.eas.status === ServiceStatus.PROCESSING
  ) {
    return QueueItemStatus.PROCESSING;
  }

  // If either service is offline, show offline
  if (
    item.directus.status === ServiceStatus.OFFLINE ||
    item.eas.status === ServiceStatus.OFFLINE
  ) {
    return QueueItemStatus.OFFLINE;
  }

  // If either service failed, show failed
  if (
    item.directus.status === ServiceStatus.FAILED ||
    item.eas.status === ServiceStatus.FAILED
  ) {
    return QueueItemStatus.FAILED;
  }

  // If both services completed, show completed (regardless of linking status)
  if (
    item.directus.status === ServiceStatus.COMPLETED &&
    item.eas.status === ServiceStatus.COMPLETED
  ) {
    return QueueItemStatus.COMPLETED;
  }

  // Default to pending
  return QueueItemStatus.PENDING;
}

// Helper to determine if an item should be auto-retried
export function shouldAutoRetry(item: QueueItem): boolean {
  // Check if the item is in initial retry phase
  if (!item.initialRetryCount || item.initialRetryCount < MAX_RETRIES_PER_BATCH) {
    return true;
  }

  // Check if the item is in slow retry mode
  if (item.enteredSlowModeAt) {
    const age = Date.now() - new Date(item.enteredSlowModeAt).getTime();
    if (age > MAX_RETRY_AGE) {
      return false; // Item is too old, no more auto-retries
    }

    // Check if enough time has passed since last attempt
    const lastAttempt = item.lastAttempt ? new Date(item.lastAttempt).getTime() : 0;
    return Date.now() - lastAttempt >= RETRY_COOLDOWN;
  }

  return false;
}

// Helper to determine if an item has completely failed (exceeded all retry attempts)
export function isCompletelyFailed(item: QueueItem): boolean {
  if (item.enteredSlowModeAt) {
    const age = Date.now() - new Date(item.enteredSlowModeAt).getTime();
    return age > MAX_RETRY_AGE;
  }
  return false;
}

export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.OFFLINE ||
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED &&
    (item.retryCount || 0) < MAX_RETRIES);
