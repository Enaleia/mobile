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

  // Count items that need retry for each service
  const getFailedServices = () => {
    return items.reduce(
      (acc, item) => {
        if (item?.directus?.status === ServiceStatus.FAILED) acc.directus++;
        if (item?.eas?.status === ServiceStatus.FAILED) acc.eas++;
        return acc;
      },
      { directus: 0, eas: 0 }
    );
  };

  const failedServices = getFailedServices();
  const totalFailures = failedServices.directus + failedServices.eas;

  const itemsSortedByMostRecent = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // For each item, determine which services need to be retried
      for (const item of items) {
        const needsDirectus = item?.directus?.status === ServiceStatus.FAILED;
        const needsEAS = item?.eas?.status === ServiceStatus.FAILED;
        
        if (needsDirectus && !needsEAS) {
          await onRetry([item], "directus");
        } else if (!needsDirectus && needsEAS) {
          await onRetry([item], "eas");
        } else if (needsDirectus && needsEAS) {
          await onRetry([item]); // Retry both if both failed
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
      disabled={isRetrying || totalFailures === 0}
      className={`h-10 px-4 rounded-full flex-row items-center justify-center border min-w-[100px] ${
        isRetrying || totalFailures === 0
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
            totalFailures === 0 ? "text-gray-400" : "text-enaleia-black"
          }`}
        >
          Retry All {totalFailures > 0 ? `(${totalFailures})` : ""}
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
