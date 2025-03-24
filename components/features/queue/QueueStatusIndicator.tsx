import { View } from "react-native";
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
          icon: "time-outline",
          color: "#6B7280", // gray-500
          text: "Pending"
        };
      case QueueItemStatus.QUEUED:
        return {
          icon: "layers-outline",
          color: "#3B82F6", // blue-500
          text: "Queued"
        };
      case QueueItemStatus.PROCESSING:
        return {
          icon: "sync",
          color: "#10B981", // green-500
          text: "Processing"
        };
      case QueueItemStatus.FAILED:
        return {
          icon: "warning-outline",
          color: "#EF4444", // red-500
          text: "Contact support"
        };
      case QueueItemStatus.OFFLINE:
        return {
          icon: "cloud-offline-outline",
          color: "#6B7280", // gray-500
          text: "Offline"
        };
      case QueueItemStatus.COMPLETED:
        return {
          icon: "checkmark-circle-outline",
          color: "#10B981", // green-500
          text: "Completed"
        };
      default:
        return {
          icon: "help-circle-outline",
          color: "#6B7280",
          text: "Unknown"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`flex-row items-center  gap-1 ${className}`}>
    <Text className="text-sm font-dm-regular text-grey-6">
        {config.text}
      </Text>
      <Ionicons 
        name={config.icon as any} 
        size={28} 
        color={config.color}
        style={status === QueueItemStatus.PROCESSING ? { transform: [{ rotate: '45deg' }] } : undefined}
      />
  
    </View>
  );
} 