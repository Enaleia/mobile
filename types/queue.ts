import { EventFormType } from "@/app/attest/new/[type]";

export enum QueueItemStatus {
  PENDING = "PENDING", // Initial state when added to queue
  PROCESSING = "PROCESSING", // Currently being processed
  OFFLINE = "OFFLINE", // Failed due to no connection
  FAILED = "FAILED", // Failed with error, can retry
  COMPLETED = "COMPLETED", // Add this
}

export interface QueueItem extends EventFormType {
  localId: string;
  status: QueueItemStatus;
  retryCount: number;
  lastError?: string;
  lastAttempt?: Date;
}
