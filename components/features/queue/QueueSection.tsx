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
            <ClearAllButton />
          </View>
        </View>

        {title.toLowerCase() === "active" && (
          <View className={
            items.length === 0 
              ? "mb-2 p-3 rounded-2xl bg-sand-beige"
              : hasProcessingItems
                ? "mb-2 p-3 rounded-2xl bg-orange-50"
                : "mb-2 p-3 rounded-2xl bg-sand-beige"
          }>
            <View className="flex-row items-start">
              {/* <Ionicons 
                name={items.length === 0 ? "information-circle" : (hasProcessingItems ? "time" : "checkmark-circle")}
                size={20}
                color={items.length === 0 ? "#6B7280" : (hasProcessingItems ? "#f59e0b" : "#3b82f6")}
                style={{ marginRight: 8, marginTop: 2 }} 
              /> */}
              <Text className={
                items.length === 0 
                  ? "text-sm font-dm-medium flex-1 flex-wrap text-gray-700"
                  : hasProcessingItems
                    ? "text-sm font-dm-medium flex-1 flex-wrap text-orange-600"
                    : "text-sm font-dm-medium flex-1 flex-wrap text-gray-700"
              }>
                {items.length === 0 
                  ? "All the active attestations will be displayed under this section."
                  : hasProcessingItems
                    ? "Currently sending attestation to database and blockchain, please do not close the app."
                    : "All the active attestations will be automatically sent to database and blockchain shortly."}
              </Text>
            </View>
          </View>
        )}

        <View className="rounded-2xl overflow-hidden border border-gray-200 mt-1">
          {hasItems ? (
            itemsSortedByMostRecent.map((item, index) => (
              <QueueAction 
                key={item.localId} 
                item={item}
                isLastItem={index === itemsSortedByMostRecent.length - 1}
              />
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
    </View>
  );
};

export default QueueSection;
