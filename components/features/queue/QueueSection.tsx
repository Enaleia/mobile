import { QueueItem, ServiceStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";
import { useState } from "react";
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

  const showBadge = items.length > 0;
  const hasItems = items.length > 0;

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
    return items.some(item => {
      const directusStatus = item?.directus?.status;
      const easStatus = item?.eas?.status;
      
      // Allow retry if either service failed
      if (directusStatus === ServiceStatus.FAILED || easStatus === ServiceStatus.FAILED) {
        return true;
      }
      
      // Allow retry if one service is completed and the other is pending/offline
      if (directusStatus === ServiceStatus.COMPLETED && 
          (easStatus === ServiceStatus.PENDING || easStatus === ServiceStatus.OFFLINE)) {
        return true;
      }
      
      if (easStatus === ServiceStatus.COMPLETED && 
          (directusStatus === ServiceStatus.PENDING || directusStatus === ServiceStatus.OFFLINE)) {
        return true;
      }
      
      return false;
    });
  };

  const itemsSortedByMostRecent = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // For each item, determine which services need to be retried
      for (const item of items) {
        const directusStatus = item?.directus?.status;
        const easStatus = item?.eas?.status;
        
        // If database failed but blockchain succeeded, retry database
        if (directusStatus === ServiceStatus.FAILED && easStatus === ServiceStatus.COMPLETED) {
          await onRetry([item], "directus");
        }
        // If blockchain failed but database succeeded, retry blockchain
        else if (easStatus === ServiceStatus.FAILED && directusStatus === ServiceStatus.COMPLETED) {
          await onRetry([item], "eas");
        }
        // If both failed, retry both
        else if (directusStatus === ServiceStatus.FAILED && easStatus === ServiceStatus.FAILED) {
          await onRetry([item]);
        }
        // If one is completed and the other is pending/offline, retry the pending one
        else if (directusStatus === ServiceStatus.COMPLETED && 
                (easStatus === ServiceStatus.PENDING || easStatus === ServiceStatus.OFFLINE)) {
          await onRetry([item], "eas");
        }
        else if (easStatus === ServiceStatus.COMPLETED && 
                (directusStatus === ServiceStatus.PENDING || directusStatus === ServiceStatus.OFFLINE)) {
          await onRetry([item], "directus");
        }
      }
    } finally {
      setIsRetrying(false);
    }
  };

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
                {items.length}
              </Text>
            </View>
          )}
        </View>

        {showRetry && items.length > 0 && (
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
