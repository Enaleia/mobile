import { EventFormType } from "@/app/attest/new/[slug]";

export enum QueueItemStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  OFFLINE = "OFFLINE",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export interface QueueItem extends EventFormType {
  localId: string;
  status: QueueItemStatus;
  retryCount: number;
  lastError?: string;
  lastAttempt?: Date;
  actionId?: number;
}

export const MAX_RETRIES = 3;
