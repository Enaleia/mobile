import { EventFormType } from "@/app/attest/new/[slug]";

export const PROCESSING_TIMEOUT = 30 * 1000;  // 30 seconds per attempt
export const MAX_RETRIES_PER_BATCH = 2;       // 2 attempt in initial phase
export const MAX_TOTAL_RETRIES = 10;           // Maximum 10 total retries allowed

export enum QueueItemStatus {
  "PENDING" = "PENDING",
  "PROCESSING" = "PROCESSING",
  "COMPLETED" = "COMPLETED",
  "FAILED" = "FAILED",
  "OFFLINE" = "OFFLINE"
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

  // Service-specific states
  directus: ServiceState;
  eas: ServiceState & {
    txHash?: string;
    verified?: boolean;
  };
}

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
  const retryCount = item.retryCount || 0;
  // Only allow retry if within BOTH limits
  return retryCount < MAX_RETRIES_PER_BATCH && retryCount < MAX_TOTAL_RETRIES;
}

// Helper to determine if an item has completely failed (exceeded all retry attempts)
export function isCompletelyFailed(item: QueueItem): boolean {
  const retryCount = item.retryCount || 0;
  // Failed if exceeded EITHER limit
  return retryCount >= MAX_RETRIES_PER_BATCH || retryCount >= MAX_TOTAL_RETRIES;
}

// Helper to determine if an item is pending
export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.OFFLINE ||
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED && !isCompletelyFailed(item));
