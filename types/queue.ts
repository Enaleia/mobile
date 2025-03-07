import { EventFormType } from "@/app/attest/new/[slug]";

export enum QueueItemStatus {
  "PENDING",
  "PROCESSING",
  "OFFLINE",
  "FAILED",
  "COMPLETED",
}

export interface QueueItem extends Omit<EventFormType, "type"> {
  localId: string;
  status: QueueItemStatus;
  retryCount: number;
  lastAttempt?: Date;
  lastError?: string;
  company?: number;
  actionId: number;
}

export const MAX_RETRIES = 3;
