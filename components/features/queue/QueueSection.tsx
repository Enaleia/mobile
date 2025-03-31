import { QueueItem, ServiceStatus, MAX_RETRIES, LIST_RETRY_INTERVAL, QueueItemStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueueAction from "@/components/features/queue/QueueAction";
import { useState, useMemo, useEffect } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { checkServicesHealth } from "@/services/healthCheck";
import { usePreferences } from "@/contexts/PreferencesContext";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[]) => Promise<void>;
  onClearAll?: () => Promise<void>;
  alwaysShow?: boolean;
}

interface HealthCheckResult {
  directus: boolean;
  eas: boolean;
  allHealthy: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  onClearAll,
  alwaysShow = false,
}: QueueSectionProps) => {
  const { isConnected } = useNetwork();
  const { showAdvancedMode } = usePreferences();
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<{ time: number; result: HealthCheckResult } | null>(null);

  // Sort items by most recent first
  const sortedItemsMemo = useMemo(() => 
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [items]
  );

  // Check if any items are currently processing
  const hasProcessingItems = useMemo(() => 
    items.some(item => item.status === QueueItemStatus.PROCESSING),
    [items]
  );

  // Separate health check effect
  useEffect(() => {
    let healthCheckInterval: NodeJS.Timeout;

    const performHealthCheck = async () => {
      try {
        const healthResult = await checkServicesHealth();
        setLastHealthCheck({ time: Date.now(), result: healthResult });
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    // Initial health check
    performHealthCheck();

    // Set up interval for health checks
    healthCheckInterval = setInterval(performHealthCheck, 30000); // 30 seconds

    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []); // Empty dependency array since we want this to run independently

  // Countdown timer effect
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    const updateCountdown = async () => {
      if (title.toLowerCase() !== 'active' || !items.length) {
        setRetryCountdown(null);
        return;
      }

      try {
        const lastBatchAttempt = await AsyncStorage.getItem('QUEUE_LAST_BATCH_ATTEMPT');
        const lastAttemptTime = lastBatchAttempt ? new Date(lastBatchAttempt).getTime() : 0;
        const now = Date.now();
        const elapsed = now - lastAttemptTime;
        const remaining = LIST_RETRY_INTERVAL - elapsed;

        if (remaining <= 0) {
          // Time to retry
          const healthResult = await checkServicesHealth();
          setLastHealthCheck({ time: Date.now(), result: healthResult });
          
          if (healthResult.allHealthy) {
            onRetry(sortedItemsMemo);
          } else {
            // If services are unhealthy, don't increment retry counter
            const modifiedItems = sortedItemsMemo.map(item => ({
              ...item,
              skipRetryIncrement: true
            }));
            onRetry(modifiedItems);
          }

          // Reset the timer
          await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());
          setRetryCountdown(LIST_RETRY_INTERVAL / 1000);
        } else {
          setRetryCountdown(Math.ceil(remaining / 1000));
        }
      } catch (error) {
        console.error('Error updating countdown:', error);
        setRetryCountdown(null);
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval for countdown updates
    countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [title, items.length, sortedItemsMemo, onRetry]);

  // Deduplicate items based on localId
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.localId)) {
        return false;
      }
      seen.add(item.localId);
      return true;
    });
  }, [items]);

  const showBadge = uniqueItems.length > 0;
  const hasItems = uniqueItems.length > 0;
  
  const getBadgeColor = (title: string) => {
    switch (title.toLowerCase()) {
      case "active":
        return "bg-blue-ocean";
      case "failed":
        return "bg-rose-500";
      case "completed":
        return "bg-emerald-600";
      default:
        return "bg-grey-3";
    }
  };

  const handleRetryPress = async () => {
    try {
      onRetry(sortedItemsMemo);
    } catch (error) {
      console.error('Error during retry:', error);
    }
  };

  if (!hasItems && !alwaysShow) return null;

  return (
    <View className="flex-1">
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          {/* Left: Title and badge */}
          <View className="flex-row items-center">
            <Text className="text-lg font-dm-bold">{title}</Text>
            {showBadge && (
              <View
                className={`${getBadgeColor(
                  title
                )} rounded-full w-12 h-7 ml-2 flex items-center justify-center`}
              >
                <Text className="text-white text-sm font-dm-medium">
                  {uniqueItems.length}
                </Text>
              </View>
            )}
          </View>

          {/* Center and Right: Countdown and Retry button */}
          {title.toLowerCase() === 'active' && items.length > 0 && retryCountdown && (
            <View className="flex-row items-center gap-2">
              {showAdvancedMode && (
                <View className="py-2 rounded-full flex-row items-center">
                  <Ionicons name="time" size={16} color="#6C9EC6" style={{ marginRight: 4 }} />
                  <Text className="text-med-ocean text-sm font-dm-medium">
                    {retryCountdown >= 60 
                      ? `${Math.floor(retryCountdown / 60)}m ${retryCountdown % 60}s`
                      : `${retryCountdown}s`}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={handleRetryPress}
                className="px-3 py-2 rounded-full border border-grey-6 flex-row items-center"
              >
                <Ionicons name="refresh" size={16} color="#4b5563" style={{ marginRight: 4 }} />
                <Text className="text-grey-6 text-sm font-dm-medium">
                  Retry 
                </Text>
              </Pressable>
            </View>
          )}

          {/* Clear button (only shown for completed section) */}
          {title.toLowerCase() === 'completed' && (
            <View className="flex-row gap-2">
              {showClearOptions ? (
                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    onPress={() => setShowClearOptions(false)}
                    className="px-2 py-1.5 rounded-full bg-white flex-row items-center"
                  >
                    <Text className="text-sm font-dm-light text-enaleia-black mr-1">Cancel</Text>
                    <View className="w-4 h-4">
                      <Ionicons name="close" size={16} color="#0D0D0D" />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (onClearAll) {
                        await onClearAll();
                        setShowClearOptions(false);
                      }
                    }}
                    className="px-2 py-1.5 rounded-full bg-rose-500 flex-row items-center"
                  >
                    <Text className="text-sm font-dm-light text-white mr-1">Clear</Text>
                    <View className="w-4 h-4">
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </View>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowClearOptions(true)}
                  className="h-10 w-10 rounded-full flex-row items-center justify-center"
                >
                  <View className="w-5 h-5">
                    <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Info Messages Stack */}
        {title.toLowerCase() === 'active' && items.length > 0 && (
          <View className="space-y-2">
            {/* Status Messages Container */}
            {(!isConnected || (lastHealthCheck && (!lastHealthCheck.result.directus || !lastHealthCheck.result.eas))) && (
              <View className="mb-1 bg-sand-beige rounded-2xl p-4 rounded-2xl">
                {/* Network Status Message */}
                {!isConnected && (
                  <View className="flex-row">
                    <View className="flex-col justify-start">
                      <View className="items-center justify-center mr-1">
                        <Ionicons 
                          name="cloud-offline" 
                          size={18} 
                          color="#6C9EC6"
                        />
                      </View>
                    </View>
                    <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                      {`Network: Unavailable. Processing will resume once connected.`.split('**').map((part, index) => 
                        index % 2 === 1 ? (
                          <Text key={index} className="font-dm-bold">{part}</Text>
                        ) : (
                          part
                        )
                      )}
                    </Text>
                  </View>
                )}

                {/* Database Status Message */}
                {lastHealthCheck && !lastHealthCheck.result.directus && (
                  <View className="flex-row">
                    <View className="flex-col justify-start">
                      <View className="items-center justify-center mr-1">
                        <Ionicons 
                          name="server" 
                          size={18} 
                          color="#6C9EC6"
                        />
                      </View>
                    </View>
                    <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                      {`Database: Unreachable`.split('**').map((part, index) => 
                        index % 2 === 1 ? (
                          <Text key={index} className="font-dm-bold">{part}</Text>
                        ) : (
                          part
                        )
                      )}
                    </Text>
                  </View>
                )}

                {/* Blockchain Status Message */}
                {lastHealthCheck && !lastHealthCheck.result.eas && (
                  <View className="flex-row">
                    <View className="flex-col justify-start">
                      <View className="items-center justify-center mr-1">
                        <Ionicons 
                          name="cube" 
                          size={18} 
                          color="#6C9EC6"
                        />
                      </View>
                    </View>
                    <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                      {`Blockchain: Unreachable`.split('**').map((part, index) => 
                        index % 2 === 1 ? (
                          <Text key={index} className="font-dm-bold">{part}</Text>
                        ) : (
                          part
                        )
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Failed Section Message */}
        {title.toLowerCase() === 'failed' && items.length > 0 && (
          <View className="mb-2 py-2 px-4 rounded-2xl bg-sand-beige border border-rose-500">
            <View className="flex-row">
              <View className="flex-col justify-start mr-1">
                <View className="items-center justify-center">
                  <Ionicons 
                    name="help-buoy" 
                    size={18} 
                    color="#ef4444"
                  />
                </View>
              </View>
              <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                Failed items require your help to be rescued. Tap item and email your data to  Enaleia.
              </Text>
            </View>
          </View>
        )}

        <View className="rounded-2xl overflow-hidden border border-gray-200 mt-1">
          {hasItems ? (
            uniqueItems.map((item, index) => (
              <QueueAction 
                key={`${item.localId}-${item.date}-${index}`} 
                item={item}
                isLastItem={index === uniqueItems.length - 1}
                isProcessing={hasProcessingItems}
              />
            ))
          ) : (
            <View className="p-4 bg-white">
              <Text className="text-sm text-grey-9">
                {title === "Active"
                  ? "No active items"
                  : title === "Completed"
                  ? "No completed items"
                  : "No items"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default QueueSection;
