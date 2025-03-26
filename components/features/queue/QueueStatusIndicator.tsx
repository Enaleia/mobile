import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueueItemStatus } from "@/types/queue";
import { Text } from "react-native";

interface QueueStatusIndicatorProps {
  status: QueueItemStatus;
  className?: string;
}

export default function QueueStatusIndicator({ status, className = "" }: QueueStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case QueueItemStatus.PENDING:
        return {
          icon: "time",
          color: "#737373", // grey-400
          text: "Pending"
        };
      case QueueItemStatus.QUEUED:
        return {
          icon: "layers-outline",
          color: "#0D0D0D", // enaleia-black
          text: "Queued"
        };
      case QueueItemStatus.PROCESSING:
        return {
          icon: "sync",
          color: "#737373", // grey-400
          text: "Processing"
        };
      case QueueItemStatus.FAILED:
        return {
          icon: "alert-circle",
          color: "#f43f5e", // rose-500
          text: "Contact support"
        };
      case QueueItemStatus.OFFLINE:
        return {
          icon: "cloud-offline",
          color: "#737373", // grey-400
          text: "Offline"
        };
      case QueueItemStatus.COMPLETED:
        return {
          icon: "checkmark-circle",
          color: "#059669", // emerald-600
          text: "Completed"
        };
      default:
        return {
          icon: "help-circle",
          color: "#0D0D0D", // enaleia-black
          text: "Unknown"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`flex-row items-center gap-1 ${className}`}>
      <Text className="text-sm font-dm-regular text-grey-6">
        {config.text}
      </Text>
      {status === QueueItemStatus.PROCESSING ? (
        <ActivityIndicator size="small" color="#0D0D0D" />
      ) : (
        <Ionicons 
          name={config.icon as any} 
          size={28} 
          color={config.color}
        />
      )}
    </View>
  );
} 