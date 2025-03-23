import { QueueItem, QueueItemStatus, MAX_RETRIES } from "@/types/queue";

export const isProcessingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.PROCESSING;

export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.OFFLINE ||
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED &&
    (item.retryCount || 0) < MAX_RETRIES);

export const isFailedItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.FAILED &&
  (item.retryCount || 0) >= MAX_RETRIES;

export const isCompletedItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.COMPLETED;

export const filterQueueItems = (items: QueueItem[]) => {
  const processingItems = items.filter(isProcessingItem);
  const pendingItems = items.filter(isPendingItem);
  const failedItems = items.filter(isFailedItem);
  const completedItems = items.filter(isCompletedItem);

  return {
    // Combine processing and pending items
    pendingItems: [...processingItems, ...pendingItems],
    failedItems,
    completedItems,
  };
};

// Helper to check if an item needs attention (pending or failed)
export const needsAttention = (item: QueueItem): boolean =>
  isPendingItem(item) || isFailedItem(item);

// Helper to get total count of items needing attention
export const getAttentionCount = (items: QueueItem[]): number =>
  items.filter(needsAttention).length;
