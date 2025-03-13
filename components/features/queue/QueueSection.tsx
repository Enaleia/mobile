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
  isCollapsible?: boolean;
  alwaysShow?: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  showRetry = true,
  isCollapsible = false,
  alwaysShow = false,
}: QueueSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(
    title === "Completed" ||
      title === "Failed" ||
      (!alwaysShow && items.length === 0)
  );
  const [isRetrying, setIsRetrying] = useState({
    all: false,
    directus: false,
    eas: false,
  });

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

  // Count items that need retry for each service with null checks
  const getServiceRetryCounts = () => {
    return items.reduce(
      (acc, item) => {
        if (item?.directus?.status === ServiceStatus.FAILED) acc.directus++;
        if (item?.eas?.status === ServiceStatus.FAILED) acc.eas++;
        return acc;
      },
      { directus: 0, eas: 0 }
    );
  };

  const retryCounts = getServiceRetryCounts();

  const itemsSortedByMostRecent = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleRetry = async (service?: "directus" | "eas") => {
    const retryKey = service || "all";
    setIsRetrying((prev) => ({ ...prev, [retryKey]: true }));
    try {
      await onRetry(items, service);
    } finally {
      setIsRetrying((prev) => ({ ...prev, [retryKey]: false }));
    }
  };

  if (!hasItems && !alwaysShow) return null;

  const RetryButton = ({
    service,
    count,
  }: {
    service?: "directus" | "eas";
    count?: number;
  }) => (
    <Pressable
      onPress={() => handleRetry(service)}
      disabled={
        isRetrying[service || "all"] || (count !== undefined && count === 0)
      }
      className={`h-10 px-4 rounded-full flex-row items-center justify-center border min-w-[100px] ${
        isRetrying[service || "all"] || (count !== undefined && count === 0)
          ? "bg-white-sand border-grey-6"
          : "bg-white border-grey-6"
      }`}
    >
      {isRetrying[service || "all"] ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#0D0D0D" />
          <Text className="text-enaleia-black font-dm-medium ml-2">
            Retrying...
          </Text>
        </View>
      ) : (
        <Text
          className={`font-dm-medium ${
            count !== undefined && count === 0
              ? "text-gray-400"
              : "text-enaleia-black"
          }`}
        >
          {service
            ? `Retry ${service === "directus" ? "API" : "Chain"} (${count})`
            : "Retry All"}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => isCollapsible && setIsCollapsed(!isCollapsed)}
        className="flex-row justify-between items-center mb-2"
      >
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
          {isCollapsible && (
            <Ionicons
              name={isCollapsed ? "chevron-forward" : "chevron-down"}
              size={20}
              color="#666"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </Pressable>

      {showRetry && !isCollapsed && (
        <View className="flex-row gap-2 mb-2">
          <RetryButton />
          {title === "Failed" && (
            <>
              <RetryButton service="directus" count={retryCounts.directus} />
              <RetryButton service="eas" count={retryCounts.eas} />
            </>
          )}
        </View>
      )}

      {!isCollapsed && (
        <View className="rounded-2xl overflow-hidden border border-gray-200 mt-1">
          {hasItems ? (
            itemsSortedByMostRecent.map((item) => (
              <QueuedAction key={item.localId} item={item} />
            ))
          ) : (
            <View className="py-8 px-4 bg-sand-beige">
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
      )}
    </View>
  );
};

export default QueueSection;
