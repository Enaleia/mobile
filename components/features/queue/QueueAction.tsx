import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus, RETRY_COOLDOWN } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import ProcessingPill from "./ProcessingPill";
import { router } from "expo-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";

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

  // Helper to get status color
  const getStatusColor = (status?: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "bg-green-500";
      case ServiceStatus.PROCESSING:
        return "bg-blue-500";
      case ServiceStatus.FAILED:
        return "bg-red-500";
      case ServiceStatus.OFFLINE:
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  // Helper to get status text
  const getStatusText = (status?: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "Completed";
      case ServiceStatus.PROCESSING:
        return "Processing";
      case ServiceStatus.FAILED:
        return "Failed";
      case ServiceStatus.OFFLINE:
        return "Offline";
      case ServiceStatus.PENDING:
        return item.directus?.enteredSlowModeAt ? "Waiting for retry" : "Pending";
      default:
        return "Pending";
    }
  };

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
          <Text
            className="font-dm-bold text-base tracking-tight"
            numberOfLines={1}
          >
            {action.name}
          </Text>
          <Text className="text-gray-600 text-sm">{formattedTime}</Text>

          {/* Service Status Indicators */}
          <View className="flex-col space-y-2 mt-2">
            {/* Directus Status */}
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full ${getStatusColor(item.directus?.status)} mr-1`} />
              <Text className="text-sm">
                Database: {getStatusText(item.directus?.status)}
              </Text>
            </View>

            {/* EAS Status */}
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full ${getStatusColor(item.eas?.status)} mr-1`} />
              <Text className="text-sm">
                Blockchain: {getStatusText(item.eas?.status)}
              </Text>
            </View>

            {/* Linking Status */}
            {(item.directus?.status === ServiceStatus.COMPLETED && item.eas?.status === ServiceStatus.COMPLETED) && (
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full ${item.directus?.linked ? 'bg-green-500' : 'bg-yellow-500'} mr-1`} />
                <Text className="text-sm">
                  {item.directus?.linked ? 'Linked' : 'Linking...'}
                </Text>
              </View>
            )}

            {/* Retry Information */}
            {getRetryInfo() && (
              <Text className="text-xs text-gray-500 mt-1">
                {getRetryInfo()}
              </Text>
            )}
          </View>
        </View>
        {isProcessing && <ProcessingPill />}
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
