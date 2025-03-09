import { QueueItem } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[]) => Promise<void>;
  showRetry?: boolean;
  isCollapsible?: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  showRetry = true,
  isCollapsible = false,
}: QueueSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(
    title === "Completed" || title === "Failed" || items.length === 0
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const showBadge = items.length > 0;

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
            disabled={isRetrying}
            className={`h-10 px-4 rounded-full flex-row items-center justify-center border min-w-[100px] ${
              isRetrying 
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
              <Text className="text-enaleia-black font-dm-medium">
                Retry All
              </Text>
            )}
          </Pressable>
        )}
      </Pressable>
      {!isCollapsed && (
        <View className="rounded-2xl overflow-hidden border border-gray-200">
          {itemsSortedByMostRecent.map((item) => (
            <QueuedAction key={item.localId} item={item} />
          ))}
        </View>
      )}
    </View>
  );
};

export default QueueSection;
