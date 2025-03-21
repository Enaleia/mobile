import { QueueItem, ServiceStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
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
    switch (title) {
      case "Completed":
        return "bg-grey-6";
      default:
        return "bg-red-500";
    }
  };

  // Check if any items need retry for each service
  const needsRetry = () => {
    return uniqueItems.some(item => {
      const directusStatus = item?.directus?.status;
      const easStatus = item?.eas?.status;
      
      // Failed states
      if (directusStatus === ServiceStatus.FAILED || easStatus === ServiceStatus.FAILED) {
        return true;
      }
      
      // Pending/Offline states
      const isPendingOrOffline = (status?: ServiceStatus) => 
        status === ServiceStatus.PENDING || status === ServiceStatus.OFFLINE;

      if (isPendingOrOffline(directusStatus) || isPendingOrOffline(easStatus)) {
        return true;
      }
      
      return false;
    });
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      for (const item of uniqueItems) {
        const directusStatus = item?.directus?.status;
        const easStatus = item?.eas?.status;
        
        const isDirectusFailed = directusStatus === ServiceStatus.FAILED;
        const isEasFailed = easStatus === ServiceStatus.FAILED;
        const isDirectusPendingOrOffline = directusStatus === ServiceStatus.PENDING || directusStatus === ServiceStatus.OFFLINE;
        const isEasPendingOrOffline = easStatus === ServiceStatus.PENDING || easStatus === ServiceStatus.OFFLINE;
        
        // Determine which service(s) to retry
        if (isDirectusFailed && !isEasFailed) {
          // Only Directus failed
          await onRetry([item], "directus");
        } else if (isEasFailed && !isDirectusFailed) {
          // Only EAS failed
          await onRetry([item], "eas");
        } else if (isDirectusFailed && isEasFailed) {
          // Both failed
          await onRetry([item]);
        } else if (isDirectusPendingOrOffline && !isEasPendingOrOffline) {
          // Only Directus pending/offline
          await onRetry([item], "directus");
        } else if (isEasPendingOrOffline && !isDirectusPendingOrOffline) {
          // Only EAS pending/offline
          await onRetry([item], "eas");
        } else if (isDirectusPendingOrOffline && isEasPendingOrOffline) {
          // Both pending/offline
          await onRetry([item]);
        }
      }
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
            Retrying...
          </Text>
        </View>
      ) : (
        <Text
          className={`font-dm-medium ${
            !needsRetry() ? "text-gray-400" : "text-enaleia-black"
          }`}
        >
          Retry
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
              {title === "Pending"
                ? "There are no pending items"
                : title === "Completed"
                ? "There are no completed items"
                : `No ${title.toLowerCase()} attestations`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default QueueSection;
