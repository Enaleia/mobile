import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import ServiceStatusIndicator from "./ServiceStatusIndicator";
import { MotiView } from "moti";

interface QueuedActionProps {
  item: QueueItem;
}

const QueuedAction = ({ item }: QueuedActionProps) => {
  const { actions } = useBatchData();
  const action = actions?.find((a: Action) => a.id === item.actionId);
  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

  if (!action) return null;

  const isProcessing = item.status === QueueItemStatus.PROCESSING;
  const hasBeenTried = item.lastAttempt !== undefined;

  return (
    <Pressable
      onPress={() => {
        console.log("Navigating to queue detail with id:", item.localId);
        router.push(`/queue/${item.localId}`);
      }}
      className="bg-white px-6 py-4 border-b border-gray-200 active:opacity-70"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 flex-col gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-dm-bold text-base tracking-tight flex-1"
              numberOfLines={1}
            >
              {action.name}
            </Text>
            {isProcessing ? (
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  type: "timing",
                  duration: 1000,
                  loop: true,
                }}
              >
                <Ionicons name="sync-circle" size={20} color="#0D9BFF" />
              </MotiView>
            ) : hasBeenTried ? (
              <Ionicons name="close-circle" size={20} color="#f59e0b" />
            ) : (
              <Ionicons name="time" size={20} color="#f59e0b" />
            )}
          </View>
          <Text className="text-gray-600 text-sm">{formattedTime}</Text>

          {/* Service Status Indicators */}
          <View className="flex-row space-x-3">
            <ServiceStatusIndicator
              status={item.directus?.status || ServiceStatus.PENDING}
              type="directus"
              extraClasses="mr-3"
            />
            <ServiceStatusIndicator
              status={item.eas?.status || ServiceStatus.PENDING}
              type="eas"
            />
          </View>
        </View>
      </View>

      {/* Error Messages */}
      {item.lastError && (
        <Text className="text-red-500 text-sm mt-2">{item.lastError}</Text>
      )}
    </Pressable>
  );
};

export default QueuedAction;
