import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus, RETRY_COOLDOWN } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import QueueStatusIndicator from "./QueueStatusIndicator";

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
  const isProcessing = isProcessingItem(item);

  // Helper to get retry information
  const getRetryInfo = () => {
    if (!item.directus?.enteredSlowModeAt) return null;

    const nextRetryTime = new Date(
      (item.directus.lastAttempt ? new Date(item.directus.lastAttempt).getTime() : Date.now()) 
      + RETRY_COOLDOWN
    );
    const timeUntilNextRetry = nextRetryTime.getTime() - Date.now();
    
    if (timeUntilNextRetry > 0) {
      const minutes = Math.ceil(timeUntilNextRetry / (60 * 1000));
      return `Next retry in ${minutes}m`;
    }
    return null;
  };

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
          <View className="flex-row justify-between items-center">
            <Text
              className="font-dm-bold text-base tracking-tight flex-1"
              numberOfLines={1}
            >
              {action.name}
            </Text>
            <QueueStatusIndicator status={item.status} />
          </View>
          <Text className="text-gray-600 text-sm">{formattedTime}</Text>

          {/* Service Status Indicators */}
          <View className="flex-row justify-between items-center mt-2">
            <ServiceStatusIndicator
              status={item.directus?.status || ServiceStatus.PENDING}
              type="directus"
              extraClasses="flex-1"
            />
            <ServiceStatusIndicator
              status={item.eas?.status || ServiceStatus.PENDING}
              type="eas"
              extraClasses="flex-1"
            />
            <ServiceStatusIndicator
              status={item.directus?.linked ? ServiceStatus.COMPLETED : ServiceStatus.PENDING}
              type="linking"
              extraClasses="flex-1"
            />
          </View>

          {/* Retry Information */}
          {getRetryInfo() && (
            <Text className="text-xs text-gray-500 mt-1">
              {getRetryInfo()}
            </Text>
          )}
        </View>
      </View>

      {/* Error Messages */}
      {(item.directus?.error || item.eas?.error) &&
        item.status !== QueueItemStatus.COMPLETED && (
          <View className="mt-2 space-y-1">
            {item.directus?.error && (
              <Text className="text-red-500 text-sm" numberOfLines={2}>
                Database: {item.directus.error}
              </Text>
            )}
            {item.eas?.error && (
              <Text className="text-red-500 text-sm" numberOfLines={2}>
                Blockchain: {item.eas.error}
              </Text>
            )}
          </View>
        )}

      {/* EAS Transaction Hash */}
      {item.eas?.txHash && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            item.eas?.txHash &&
              Linking.openURL(
                EAS_CONSTANTS.getAttestationUrl(
                  item.eas.txHash,
                  item.eas.network || "sepolia"
                )
              );
          }}
          className="mt-2"
        >
          <Text
            className="text-xs text-blue-500 underline"
            numberOfLines={1}
          >
            View on {item.eas.network || "sepolia"}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default QueuedAction;
