import { QueueItem } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[]) => Promise<void>;
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
    title === "Completed" || title === "Failed" || (!alwaysShow && items.length === 0)
  );
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

  const itemsSortedByMostRecent = items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry(items);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!hasItems && !alwaysShow) return null;

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => isCollapsible && setIsCollapsed(!isCollapsed)}
        className="flex-row justify-between items-center mb-2"
      >
        <View className="flex-row items-center">
          <Text className="text-lg font-dm-bold">{title}</Text>
          {showBadge && (
            <View className={`${getBadgeColor(title)} rounded-full w-6 h-6 ml-2 flex items-center justify-center`}>
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
        {showRetry && (
          <Pressable
            onPress={handleRetry}
            disabled={isRetrying || !hasItems}
            className={`h-10 px-4 rounded-full flex-row items-center justify-center border min-w-[100px] ${
              isRetrying || !hasItems
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
              <Text className={`font-dm-medium ${!hasItems ? "text-gray-400" : "text-enaleia-black"}`}>
                Retry All
              </Text>
            )}
          </Pressable>
        )}
      </Pressable>
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
