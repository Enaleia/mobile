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
            <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-sm font-dm-medium">
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
            className={`px-3 py-1 rounded-full flex-row items-center ${
              isRetrying ? "bg-blue-400" : "bg-blue-500"
            }`}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-dm-medium">Retry All</Text>
            )}
          </Pressable>
        )}
      </Pressable>
      {!isCollapsed && (
        <View className="rounded-lg overflow-hidden border border-gray-200">
          {items.map((item) => (
            <QueuedAction key={item.localId} item={item} />
          ))}
        </View>
      )}
    </View>
  );
};

export default QueueSection;
