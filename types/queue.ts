import { EventFormType } from "@/app/attest/new/[slug]";

export enum QueueItemStatus {
  "PENDING" = "PENDING",
  "PROCESSING" = "PROCESSING",
  "OFFLINE" = "OFFLINE",
  "FAILED" = "FAILED",
  "COMPLETED" = "COMPLETED",
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

  // If both services completed, show completed
  if (
    item.directus.status === ServiceStatus.COMPLETED &&
    item.eas.status === ServiceStatus.COMPLETED
  ) {
    return QueueItemStatus.COMPLETED;
  }

  // Default to pending
  return QueueItemStatus.PENDING;
}
