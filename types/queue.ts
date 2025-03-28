import { EventFormType } from "@/app/attest/new/[slug]";
import { MaterialDetail } from "@/types/material";

export const PROCESSING_TIMEOUT = 15 * 1000;  // 15 seconds per attempt
export const MAX_RETRIES = 15; // Maximum total retries before completely failing
export const LIST_RETRY_INTERVAL = 1 * 30 * 1000; // 1 minute in milliseconds

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

export interface QueueItem {
  localId: string;
  date: string;
  actionId: number;
  location?: {
    coords: {
      latitude: number;
      longitude: number;
    };
  };
  collectorId?: string;
  incomingMaterials?: MaterialDetail[];
  outgoingMaterials?: MaterialDetail[];
  manufacturing?: {
    product?: string;
    quantity?: number;
    weightInKg?: number;
  };
  status: QueueItemStatus;
  lastError?: string;
  lastAttempt?: string;
  totalRetryCount: number; // Total number of retries across all attempts
  directus?: {
    status: ServiceStatus;
    error?: string;
    eventId?: number;
    linked?: boolean;
  };
  eas?: {
    status: ServiceStatus;
    error?: string;
    txHash?: string;
  };
}

export function shouldAutoRetry(item: QueueItem): boolean {
  // Don't retry if item is completed or completely failed
  if (item.status === QueueItemStatus.COMPLETED || isCompletelyFailed(item)) {
    return false;
  }

  // Don't retry if we've exceeded max total retries
  if (item.totalRetryCount >= MAX_RETRIES) {
    return false;
  }

  // Check service statuses
  const hasFailedService = item.directus?.status === ServiceStatus.FAILED || 
                          item.eas?.status === ServiceStatus.FAILED;
  const hasPendingService = item.directus?.status === ServiceStatus.PENDING || 
                           item.eas?.status === ServiceStatus.PENDING;

  // Retry if we have a failed service or a pending service
  return hasFailedService || hasPendingService;
}

export function isCompletelyFailed(item: QueueItem): boolean {
  // Check if item has exceeded max total retries
  if (item.totalRetryCount >= MAX_RETRIES) {
    return true;
  }

  // Check if all services are failed
  const allServicesFailed = 
    (item.directus?.status === ServiceStatus.FAILED || !item.directus) &&
    (item.eas?.status === ServiceStatus.FAILED || !item.eas);

  return allServicesFailed;
}

export function getOverallStatus(item: QueueItem): QueueItemStatus {
  // If any service is offline, mark the whole item as offline
  if (item.directus?.status === ServiceStatus.OFFLINE || 
      item.eas?.status === ServiceStatus.OFFLINE) {
    return QueueItemStatus.OFFLINE;
  }

  // If all services are completed, mark as completed
  if (item.directus?.status === ServiceStatus.COMPLETED && 
      item.eas?.status === ServiceStatus.COMPLETED) {
    return QueueItemStatus.COMPLETED;
  }

  // If any service is processing, mark as processing
  if (item.directus?.status === ServiceStatus.PROCESSING || 
      item.eas?.status === ServiceStatus.PROCESSING) {
    return QueueItemStatus.PROCESSING;
  }

  // If any service is failed, mark as failed
  if (item.directus?.status === ServiceStatus.FAILED || 
      item.eas?.status === ServiceStatus.FAILED) {
    return QueueItemStatus.FAILED;
  }

  // Default to pending
  return QueueItemStatus.PENDING;
}

export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.OFFLINE ||
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED && item.totalRetryCount < MAX_RETRIES);
