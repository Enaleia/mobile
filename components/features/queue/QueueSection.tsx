import { QueueItem, ServiceStatus, MAX_RETRIES, LIST_RETRY_INTERVAL, isCompletelyFailed, QueueItemStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueueAction from "@/components/features/queue/QueueAction";
import { useState, useMemo, useEffect } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<string>('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Check if any items are currently processing
  const hasProcessingItems = useMemo(() => 
    items.some(item => item.status === QueueItemStatus.PROCESSING),
  [items]);

  // Update retry countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateCountdown = async () => {
      if (title.toLowerCase() !== 'active' || items.length === 0 || hasProcessingItems) {
        setRetryCountdown('');
        return;
      }

      // Get the last batch attempt time
      const lastBatchAttempt = await AsyncStorage.getItem('QUEUE_LAST_BATCH_ATTEMPT');
      
      if (!lastBatchAttempt) {
        setRetryCountdown('');
        return;
      }

      const elapsed = Date.now() - new Date(lastBatchAttempt).getTime();
      const remaining = LIST_RETRY_INTERVAL - elapsed;
      
      if (remaining > 0) {
        // For times less than a minute, just show seconds
        if (remaining < 60 * 1000) {
          const seconds = Math.ceil(remaining / 1000);
          setRetryCountdown(`${seconds}s`);
        } else {
          // For times over a minute, show minutes and seconds
          const minutes = Math.floor(remaining / (60 * 1000));
          const seconds = Math.ceil((remaining % (60 * 1000)) / 1000);
          setRetryCountdown(`${minutes}m ${seconds}s`);
        }
      } else {
        // If countdown is done, clear it and trigger retry
        setRetryCountdown('');
        if (!hasProcessingItems) {
          setIsProcessingBatch(true);
          onRetry(sortedItems);
        }
      }
    };

    // Update immediately
    updateCountdown();
    // Then update every second
    intervalId = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [title, items, hasProcessingItems, onRetry]);

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
      case "completed":
        return "bg-emerald-600";
      case "active":
        return "bg-blue-ocean";
      case "critical":
        return "bg-rose-500";
      default:
        return "bg-grey-6";
    }
  };

  const getInfoMessage = (title: string) => {
    switch (title.toLowerCase()) {
      case "active":
        if (items.length === 0) {
          return "All the active attestations will be displayed under this section.";
        }
        return hasProcessingItems
          ? "Currently sending attestation to database and blockchain, please do not close the app."
          : "All the active attestations will be automatically sent to database and blockchain shortly.";
      case "critical":
        if (items.length === 0) {
          return "Items that have completely failed and exceeded their retry window will appear here.";
        }
        return "These items have failed all retry attempts and require manual intervention.";
      default:
        return null;
    }
  };

  const getInfoMessageStyle = (title: string) => {
    if (title.toLowerCase() === "active") {
      if (items.length === 0) {
        return "text-sm font-dm-medium flex-1 flex-wrap text-gray-700";
      }
      return hasProcessingItems
        ? "text-sm font-dm-medium flex-1 flex-wrap text-orange-600"
        : "text-sm font-dm-medium flex-1 flex-wrap text-gray-700";
    }
    if (title.toLowerCase() === "critical") {
      return "text-sm font-dm-medium flex-1 flex-wrap text-gray-700";
    }
    return "text-sm font-dm-medium flex-1 flex-wrap text-gray-700";
  };

  const getInfoBoxStyle = (title: string) => {
    if (title.toLowerCase() === "active") {
      return items.length === 0 
        ? "mb-2 p-3 rounded-2xl bg-sand-beige"
        : hasProcessingItems
          ? "mb-2 p-3 rounded-2xl bg-orange-50"
          : "mb-2 p-3 rounded-2xl bg-sand-beige";
    }
    if (title.toLowerCase() === "critical") {
      return "mb-2 p-3 rounded-2xl bg-sand-beige";
    }
    return "mb-2 p-3 rounded-2xl bg-sand-beige";
  };

  const handleClearAll = async () => {
    if (onClearAll) {
      await onClearAll();
      setShowClearOptions(false);
    }
  };

  const ClearAllButton = () => {
    if (title.toLowerCase() !== "completed" || !hasItems) return null;

    if (showClearOptions) {
      return (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setShowClearOptions(false)}
            className="h-10 px-4 rounded-full flex-row items-center justify-center border bg-white border-grey-6"
          >
            <Text className="text-enaleia-black font-dm-light text-sm">Cancel</Text>
            <View className="w-4 h-4 ml-1">
              <Ionicons name="close" size={16} color="#0D0D0D" />
            </View>
          </Pressable>
          <Pressable
            onPress={handleClearAll}
            className="h-10 px-4 rounded-full flex-row items-center justify-center bg-[#FF453A]"
          >
            <Text className="text-white font-dm-light text-sm">Clear</Text>
            <View className="w-4 h-4 ml-1">
              <Ionicons name="trash-outline" size={16} color="white" />
            </View>
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => setShowClearOptions(true)}
        className="h-10 w-10 rounded-full flex-row items-center justify-center"
      >
        <View className="w-5 h-5">
          <Ionicons name="trash-outline" size={20} color="#8E8E93" />
        </View>
      </Pressable>
    );
  };

  // Sort items by most recent first
  const sortedItems = useMemo(() => 
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [items]);

  if (!hasItems && !alwaysShow) return null;

  return (
    <View className="flex-1">
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center flex-1">
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
            {title.toLowerCase() === 'active' && items.length > 0 && !hasProcessingItems && (
              <View className="flex-row items-center">
                <Text className="text-sm text-grey-9 ml-2">
                  Next retry: {retryCountdown}
                </Text>
                <Pressable
                  onPress={() => {
                    setIsProcessingBatch(true);
                    onRetry(sortedItems);
                  }}
                  className="ml-2 px-3 py-1.5 rounded-full bg-blue-ocean flex-row items-center"
                >
                  <Ionicons name="refresh" size={16} color="white" style={{ marginRight: 4 }} />
                  <Text className="text-white text-sm font-dm-medium">
                    Retry now
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="flex-row gap-2 mt-1">
            <ClearAllButton />
          </View>
        </View>

        {getInfoMessage(title) && (
          <View className={getInfoBoxStyle(title)}>
            <View className="flex-row items-start">
              <Text className={getInfoMessageStyle(title)}>
                {getInfoMessage(title)}
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
