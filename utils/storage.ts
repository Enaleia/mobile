/**
 * Gets the cache key and validates it exists
 * @throws Error if cache key is not configured
 */
export const getActiveQueueCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_ACTIVE_QUEUE_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Active cache key is not configured. Please set EXPO_PUBLIC_ACTIVE_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Gets the completed cache key and validates it exists
 * @throws Error if completed cache key is not configured
 */
export const getCompletedQueueCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_COMPLETED_QUEUE_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Completed cache key is not configured. Please set EXPO_PUBLIC_COMPLETED_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Gets the batch cache key and validates it exists
 * @throws Error if batch cache key is not configured
 */
export const getBatchCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_BATCH_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Batch cache key is not configured. Please set EXPO_PUBLIC_BATCH_CACHE_KEY in your environment."
    );
  }
  return key;
};
