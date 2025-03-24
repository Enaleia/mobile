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
          text: "Send by email"
        };
      case QueueItemStatus.OFFLINE:
        return {
          icon: "cloud-offline-outline",
          color: "#6B7280", // gray-500
          text: "Offline"
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
    <View className={`flex-row items-center ${className}`}>
      <Ionicons 
        name={config.icon as any} 
        size={16} 
        color={config.color}
        style={status === QueueItemStatus.PROCESSING ? { transform: [{ rotate: '45deg' }] } : undefined}
      />
      <Text className="ml-1 text-xs font-dm-medium" style={{ color: config.color }}>
        {config.text}
      </Text>
    </View>
  );
} 