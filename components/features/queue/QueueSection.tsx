import { QueueItem, ServiceStatus, MAX_RETRIES_PER_BATCH, RETRY_COOLDOWN, isCompletelyFailed } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";
import { useState, useMemo } from "react";
import { useNetwork } from "@/contexts/NetworkContext";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[], service?: "directus" | "eas") => Promise<void>;
  showRetry?: boolean;
  alwaysShow?: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  showRetry = true,
  alwaysShow = false,
}: QueueSectionProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

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
        return "bg-green-500";
      case "active":
        return "bg-blue-500";
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

    return uniqueItems.some(item => {
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
    if (isRetrying) return "Retrying...";
    
    const item = uniqueItems[0]; // Use first item for status
    if (!item) return "Retry";

    if (item.directus?.enteredSlowModeAt) {
      const nextRetryTime = new Date(
        (item.directus.lastAttempt ? new Date(item.directus.lastAttempt).getTime() : Date.now()) 
        + RETRY_COOLDOWN
      );
      const timeUntilNextRetry = nextRetryTime.getTime() - Date.now();
      
      if (timeUntilNextRetry > 0) {
        const minutes = Math.ceil(timeUntilNextRetry / (60 * 1000));
        return `Next auto-retry in ${minutes}m`;
      }
    }

    return "Retry Manually";
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      for (const item of uniqueItems) {
        const directusStatus = item?.directus?.status;
        const easStatus = item?.eas?.status;
        
        const isDirectusFailed = directusStatus === ServiceStatus.FAILED;
        const isEasFailed = easStatus === ServiceStatus.FAILED;
        const isDirectusPendingOrOffline = directusStatus === ServiceStatus.PENDING || 
                                         directusStatus === ServiceStatus.OFFLINE;
        const isEasPendingOrOffline = easStatus === ServiceStatus.PENDING || 
                                     easStatus === ServiceStatus.OFFLINE;
        
        // Determine which service(s) to retry
        if (isDirectusFailed && !isEasFailed) {
          await onRetry([item], "directus");
        } else if (isEasFailed && !isDirectusFailed) {
          await onRetry([item], "eas");
        } else if (isDirectusFailed && isEasFailed) {
          await onRetry([item]);
        } else if (isDirectusPendingOrOffline && !isEasPendingOrOffline) {
          await onRetry([item], "directus");
        } else if (isEasPendingOrOffline && !isDirectusPendingOrOffline) {
          await onRetry([item], "eas");
        } else if (isDirectusPendingOrOffline && isEasPendingOrOffline) {
          await onRetry([item]);
        }
      }
    } catch (error) {
      console.error('Error during retry process:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const itemsSortedByMostRecent = useMemo(() => 
    [...uniqueItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [uniqueItems]);

  if (!hasItems && !alwaysShow) return null;

  const RetryButton = () => (
    <Pressable
      onPress={handleRetry}
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

  return (
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

        {showRetry && uniqueItems.length > 0 && (
          <View className="flex-row gap-2 mt-1">
            <RetryButton />
          </View>
        )}
      </View>

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
