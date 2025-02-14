/**
 * Gets the cache key and validates it exists
 * @throws Error if cache key is not configured
 */
export const getCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Cache key is not configured. Please set EXPO_PUBLIC_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Gets the queue cache key and validates it exists
 * @throws Error if queue cache key is not configured
 */
export const getQueueCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_QUEUE_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Queue cache key is not configured. Please set EXPO_PUBLIC_QUEUE_CACHE_KEY in your environment."
    );
  }
  return key;
};
