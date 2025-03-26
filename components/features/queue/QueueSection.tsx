import { QueueItem, ServiceStatus, MAX_RETRIES_PER_BATCH, RETRY_COOLDOWN, isCompletelyFailed, QueueItemStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueueAction from "@/components/features/queue/QueueAction";
import { useState, useMemo } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Ionicons } from "@expo/vector-icons";

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
  const [isRetrying, setIsRetrying] = useState(false);
  const [showClearOptions, setShowClearOptions] = useState(false);

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
  
  // Check if any items are currently processing
  const hasProcessingItems = useMemo(() => 
    uniqueItems.some(item => item.status === QueueItemStatus.PROCESSING),
  [uniqueItems]);

  const getBadgeColor = (title: string) => {
    switch (title.toLowerCase()) {
      case "completed":
        return "bg-emerald-600";
      case "active":
        return "bg-blue-ocean";
      default:
        return "bg-grey-6";
    }
  };

  // Check if any items need retry for each service
  const needsRetry = () => {
    // Check if any item is currently processing
    const hasProcessingItems = uniqueItems.some(item => 
      item.directus?.status === ServiceStatus.PROCESSING || 
      item.eas?.status === ServiceStatus.PROCESSING
    );

    if (hasProcessingItems) {
      return false;
    }

    // Check if any items are eligible for retry
    return uniqueItems.some(item => {
      // Don't retry completed or failed items
      if (item.status === QueueItemStatus.COMPLETED || 
          item.status === QueueItemStatus.FAILED) {
        return false;
      }

      const directusStatus = item?.directus?.status;
      const easStatus = item?.eas?.status;
      
      // Don't allow manual retry during initial auto-retry phase
      if (item.directus?.initialRetryCount !== undefined && 
          item.directus.initialRetryCount < MAX_RETRIES_PER_BATCH) {
        return false;
      }

      // Check if the item has completely failed (exceeded 7 days)
      if (isCompletelyFailed(item)) {
        return false;
      }

      // Failed states
      const hasFailed = directusStatus === ServiceStatus.FAILED || 
                       easStatus === ServiceStatus.FAILED;
      
      // Pending/Offline states
      const isPendingOrOffline = (status?: ServiceStatus) => 
        status === ServiceStatus.PENDING || status === ServiceStatus.OFFLINE;

      return hasFailed || 
             isPendingOrOffline(directusStatus) || 
             isPendingOrOffline(easStatus);
    });
  };

  const getRetryButtonText = () => {
    const item = uniqueItems[0]; // Use first item for status
    if (!item) return "Retry";

    if (item.directus?.enteredSlowModeAt) {
      const nextRetryTime = new Date(
        (item.directus.lastAttempt ? new Date(item.directus.lastAttempt).getTime() : Date.now()) 
        + RETRY_COOLDOWN
      );
      const now = new Date();
      if (nextRetryTime > now) {
        const minutesLeft = Math.ceil((nextRetryTime.getTime() - now.getTime()) / (60 * 1000));
        return `Retry in ${minutesLeft}m`;
      }
    }

    return "Retry";
  };

  const handleRetry = async (item: QueueItem, service?: "directus" | "eas") => {
    try {
      if (service === "directus") {
        await onRetry([{ ...item, status: QueueItemStatus.PENDING }], "directus");
      } else if (service === "eas") {
        await onRetry([{ ...item, status: QueueItemStatus.PENDING }], "eas");
      } else {
        await onRetry([{ ...item, status: QueueItemStatus.PENDING }]);
      }
    } catch (error) {
      console.error("Error retrying item:", error);
    }
  };

  const handleRetryAll = async (service?: "directus" | "eas") => {
    try {
      if (service === "directus") {
        await onRetry(uniqueItems.map(item => ({ ...item, status: QueueItemStatus.PENDING })), "directus");
      } else if (service === "eas") {
        await onRetry(uniqueItems.map(item => ({ ...item, status: QueueItemStatus.PENDING })), "eas");
      } else {
        await onRetry(uniqueItems.map(item => ({ ...item, status: QueueItemStatus.PENDING })));
      }
    } catch (error) {
      console.error("Error retrying all items:", error);
    }
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

  const itemsSortedByMostRecent = useMemo(() => 
    [...uniqueItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [uniqueItems]);

  if (!hasItems && !alwaysShow) return null;

  const RetryButton = () => (
    <Pressable
      onPress={() => handleRetryAll()}
      disabled={isRetrying || !needsRetry()}
      className={`h-10 px-4 rounded-full flex-row items-center justify-center border min-w-[100px] ${
        isRetrying || !needsRetry()
          ? "bg-white-sand border-grey-6"
          : "bg-white border-grey-6"
      }`}
    >
      {isRetrying ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#0D0D0D" />
          <Text className="text-enaleia-black font-dm-medium ml-2">
            {getRetryButtonText()}
          </Text>
        </View>
      ) : (
        <Text
          className={`font-dm-medium ${
            !needsRetry() ? "text-gray-400" : "text-enaleia-black"
          }`}
        >
          {getRetryButtonText()}
        </Text>
      )}
    </Pressable>
  );

  const getStatusText = (item: QueueItem) => {
    // Check for processing state
    if (item.directus?.status === ServiceStatus.PROCESSING || 
        item.eas?.status === ServiceStatus.PROCESSING) {
      return "Processing";
    }

    // Check for failed state
    if (item.directus?.status === ServiceStatus.FAILED || 
        item.eas?.status === ServiceStatus.FAILED) {
      return "Failed";
    }

    // Check for offline state
    if (item.status === QueueItemStatus.OFFLINE) {
      return "Offline";
    }

    // Default to pending
    return "Pending";
  };

  return (
    <View className="flex-1">
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
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

          <View className="flex-row gap-2 mt-1">
            {showRetry && uniqueItems.length > 0 && (
              <RetryButton />
            )}
            <ClearAllButton />
          </View>
        </View>

        {title.toLowerCase() === "active" && hasProcessingItems && (
          <View className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <View className="flex-row items-start">
              <Ionicons 
                name="information-circle" 
                size={20} 
                color="#f59e0b" 
                style={{ marginRight: 8, marginTop: 2 }} 
              />
              <Text className="text-sm font-dm-medium text-amber-800 flex-1 flex-wrap">
                Currently sending data, please do not close the app.
              </Text>
            </View>
          </View>
        )}

      <View className="rounded-2xl overflow-hidden border border-gray-200 mt-1">
        {hasItems ? (
          itemsSortedByMostRecent.map((item) => (
            <QueuedAction key={item.localId} item={item} />
          ))
        ) : (
          <View className="py-4 px-4 bg-white">
            <Text className="text-base font-dm-regular text-gray-500 text-left">
              {title === "Active"
                ? "No active items"
                : title === "Completed"
                ? "No completed items"
                : `No ${title.toLowerCase()} attestations`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default QueueSection;
