import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { View, Text } from "react-native";
import { isProcessingItem } from "@/utils/queue";
import ProcessingPill from "./ProcessingPill";
import { format } from "date-fns";
import { Action } from "@/types/action";
import { Ionicons } from "@expo/vector-icons";
import { useBatchData } from "@/hooks/data/useBatchData";

interface QueuedActionProps {
  item: QueueItem;
}

const ServiceStatusIndicator = ({
  status,
  type,
  extraClasses,
}: {
  status: ServiceStatus;
  type: "directus" | "eas";
  extraClasses?: string;
}) => {
  const getStatusColor = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "text-green-500";
      case ServiceStatus.FAILED:
        return "text-red-500";
      case ServiceStatus.PROCESSING:
        return "text-blue-500";
      case ServiceStatus.OFFLINE:
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "checkmark-circle";
      case ServiceStatus.FAILED:
        return "alert-circle";
      case ServiceStatus.PROCESSING:
        return "sync";
      case ServiceStatus.OFFLINE:
        return "cloud-offline";
      default:
        return "time";
    }
  };

  return (
    <View className={`flex-row items-center gap-1 ${extraClasses}`}>
      <Ionicons name={getStatusIcon()} size={16} className={getStatusColor()} />
      <Text className={`text-xs ${getStatusColor()}`}>
        {type === "directus" ? "API" : "Chain"}
      </Text>
    </View>
  );
};

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

  return (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
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
        {isProcessing && <ProcessingPill />}
      </View>

      {/* Error Messages */}
      {(item.directus?.error || item.eas?.error) &&
        item.status !== QueueItemStatus.COMPLETED && (
          <View className="mt-2">
            {item.directus?.error && (
              <Text className="text-red-500 text-sm" numberOfLines={1}>
                API: {item.directus.error}
              </Text>
            )}
            {item.eas?.error && (
              <Text className="text-red-500 text-sm" numberOfLines={1}>
                Chain: {item.eas.error}
              </Text>
            )}
          </View>
        )}

      {/* EAS Transaction Hash */}
      {item.eas?.txHash && (
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
          Tx: {item.eas.txHash.slice(0, 10)}...
        </Text>
      )}
    </View>
  );
};

export default QueuedAction;
