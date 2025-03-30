import { QueueItem, ServiceStatus, MAX_RETRIES, LIST_RETRY_INTERVAL, QueueItemStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueueAction from "@/components/features/queue/QueueAction";
import { useState, useMemo, useEffect } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { checkServicesHealth } from "@/services/healthCheck";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[], service?: "directus" | "eas") => Promise<void>;
  onClearAll?: () => Promise<void>;
  showRetry?: boolean;
  alwaysShow?: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  onClearAll,
  showRetry = true,
  alwaysShow = false,
}: QueueSectionProps) => {
  const { isConnected } = useNetwork();
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<string>('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [sortedItems, setSortedItems] = useState<QueueItem[]>(items);
  const [lastHealthCheck, setLastHealthCheck] = useState<{
    time: number;
    result: { directus: boolean; eas: boolean; allHealthy: boolean; };
  } | null>(null);

  // Sort items by most recent first
  const sortedItemsMemo = useMemo(() => 
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [items]);

  // Check if any items are currently processing
  const hasProcessingItems = useMemo(() => 
    items.some(item => item.status === QueueItemStatus.PROCESSING),
  [items]);

  // Update retry countdown - new implementation
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateCountdown = async () => {
      // Only check for active section and items existence
      if (title.toLowerCase() !== 'active' || items.length === 0) {
        setRetryCountdown('');
        return;
      }

      // Get current countdown or start new one
      const currentTime = Date.now();
      const nextRetryTime = parseInt(await AsyncStorage.getItem('NEXT_RETRY_TIME') || '0');
      
      if (nextRetryTime === 0 || currentTime >= nextRetryTime) {
        // Time to retry and reset countdown
        await AsyncStorage.setItem('NEXT_RETRY_TIME', (currentTime + LIST_RETRY_INTERVAL).toString());
        setIsProcessingBatch(true);
        
        // Check services health before retrying
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
      } else {
        const remaining = Math.max(0, nextRetryTime - currentTime);
        
        // Perform health check when countdown reaches 15 seconds
        if (Math.floor(remaining / 1000) === 15 && 
            (!lastHealthCheck || (currentTime - lastHealthCheck.time) > 10000)) {
          const healthResult = await checkServicesHealth();
          setLastHealthCheck({ time: currentTime, result: healthResult });
          
          // If services are unhealthy, update the UI to show status and prevent retry increment
          if (!healthResult.allHealthy) {
            console.log('Services health check failed:', healthResult);
            // Modify items to skip retry increment while services are unhealthy
            const modifiedItems = sortedItemsMemo.map(item => ({
              ...item,
              skipRetryIncrement: true
            }));
            onRetry(modifiedItems);
          }
        }

        // Format and display countdown
        if (remaining < 60 * 1000) {
          setRetryCountdown(`${Math.ceil(remaining / 1000)}s`);
        } else {
          const minutes = Math.floor(remaining / (60 * 1000));
          const seconds = Math.ceil((remaining % (60 * 1000)) / 1000);
          setRetryCountdown(`${minutes}m ${seconds}s`);
        }
      }
    };

    // Initialize timer immediately
    updateCountdown();
    // Update every second
    intervalId = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [title, items, onRetry, sortedItemsMemo, lastHealthCheck]);

  // Listen for queue updates to refresh items
  useEffect(() => {
    const handleQueueUpdate = () => {
      // Force re-sort of items when queue updates
      const newSortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSortedItems(newSortedItems);
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeListener(QueueEvents.UPDATED, handleQueueUpdate);
    };
  }, [items]);

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
        return "bg-green-500";
      default:
        return "bg-grey-3";
    }
  };

  const handleRetryPress = async () => {
    try {
      // Check services health before retrying
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
                )} rounded-full w-6 h-6 ml-2 flex items-center justify-center`}
              >
                <Text className="text-white text-xs font-dm-medium">
                  {uniqueItems.length}
                </Text>
              </View>
            )}
          </View>

          {/* Center and Right: Countdown and Retry button */}
          {title.toLowerCase() === 'active' && items.length > 0 && retryCountdown && (
            <View className="flex-row items-center gap-4">
              <Text className="text-sm text-grey-9">
                Auto in: {retryCountdown}
              </Text>
              <Pressable
                onPress={handleRetryPress}
                className="px-3 py-1.5 rounded-full bg-blue-ocean flex-row items-center"
              >
                <Ionicons name="refresh" size={16} color="white" style={{ marginRight: 4 }} />
                <Text className="text-white text-sm font-dm-medium">
                  Retry now
                </Text>
              </Pressable>
            </View>
          )}

          {/* Clear button (only shown for completed section) */}
          {title.toLowerCase() === 'completed' && (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowClearOptions(true)}
                className="h-10 w-10 rounded-full flex-row items-center justify-center"
              >
                <View className="w-5 h-5">
                  <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Info Messages Stack */}
        <View className="space-y-2">
          {/* Network Status Message */}
          {title.toLowerCase() === 'active' && items.length > 0 && !isConnected && (
            <View className="mb-2 p-3 rounded-2xl bg-blue-50 border border-blue-ocean">
              <View className="flex-row">
                <View className="flex-col justify-start mr-1">
                  <View className="w-6 h-6 items-center justify-center">
                    <Ionicons 
                      name="cloud-offline" 
                      size={20} 
                      color="#0EA5E9"
                    />
                  </View>
                </View>
                <Text className="text-sm font-dm-medium text-blue-ocean flex-1 flex-wrap">
                  {`Network: Unreachable. Processing will resume once connected.`.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <Text key={index} className="font-dm-bold">{part}</Text>
                    ) : (
                      part
                    )
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Database Status Message */}
          {title.toLowerCase() === 'active' && items.length > 0 && lastHealthCheck && !lastHealthCheck.result.directus && (
            <View className="mb-2 p-3 rounded-2xl bg-blue-50 border" style={{borderColor: 'rgba(58, 58, 206, 0.36)'}}>
              <View className="flex-row">
                <View className="flex-col justify-start mr-1">
                  <View className="w-6 h-6 items-center justify-center">
                    <Ionicons 
                      name="server" 
                      size={20} 
                      color="#0EA5E9"
                    />
                  </View>
                </View>
                <Text className="text-sm font-dm-medium text-blue-ocean flex-1 flex-wrap">
                  {`**Database:** Server unreachable`.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <Text key={index} className="font-dm-bold">{part}</Text>
                    ) : (
                      part
                    )
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Blockchain Status Message */}
          {title.toLowerCase() === 'active' && items.length > 0 && lastHealthCheck && !lastHealthCheck.result.eas && (
            <View className="mb-2 p-3 rounded-2xl bg-blue-50 border" style={{borderColor: 'rgba(58, 58, 206, 0.36)'}}>
              <View className="flex-row">
                <View className="flex-col justify-start mr-1">
                  <View className="w-6 h-6 items-center justify-center">
                    <Ionicons 
                      name="cube" 
                      size={20} 
                      color="#0EA5E9"
                    />
                  </View>
                </View>
                <Text className="text-sm font-dm-medium text-blue-ocean flex-1 flex-wrap">
                  {`**Blockchain:** Server unreachable`.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <Text key={index} className="font-dm-bold">{part}</Text>
                    ) : (
                      part
                    )
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Failed Section Message */}
          {title.toLowerCase() === 'failed' && items.length > 0 && (
            <View className="mb-2 p-3 rounded-2xl bg-sand-beige">
              <View className="flex-row">
                <View className="flex-col justify-start mr-1">
                  <View className="w-6 h-6 items-center justify-center">
                    <Ionicons 
                      name="help-buoy" 
                      size={20} 
                      color="#ef4444"
                    />
                  </View>
                </View>
                <Text className="text-sm font-dm-medium text-gray-700 flex-1 flex-wrap">
                  Failed items require rescue. Tap to email Enaleia for support.
                </Text>
              </View>
            </View>
          )}
        </View>

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
