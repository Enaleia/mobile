import { QueueItem, QueueItemStatus } from "@/types/queue";
import { View, Text } from "react-native";
import { isProcessingItem } from "@/utils/queue";
import ProcessingPill from "./ProcessingPill";
import { format } from "date-fns";
import { useActions } from "@/hooks/data/useActions";
import { Action } from "@/types/action";

interface QueuedActionProps {
  item: QueueItem;
}

const QueuedAction = ({ item }: QueuedActionProps) => {
  const { actionsData } = useActions();
  const action = actionsData?.find((a: Action) => a.id === item.actionId);
  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
  if (!action) return null;

  return (
    <View className="bg-white rounded-lg p-4 mb-2 shadow-sm">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="font-dm-medium text-base" numberOfLines={1}>
            {action.name}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {isProcessingItem(item) && <ProcessingPill />}
          <Text className="text-gray-500 text-sm">{formattedTime}</Text>
        </View>
      </View>
      {item.lastError && item.status !== QueueItemStatus.COMPLETED && (
        <Text className="text-red-500 text-sm mt-1" numberOfLines={2}>
          {item.lastError}
        </Text>
      )}
    </View>
  );
};

export default QueuedAction;
