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
          color: "#0D0D0D", // enaleia-black
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
          color: "#0D0D0D", // enaleia-black
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
          color: "#0D0D0D", // enaleia-black
          text: "Offline"
        };
      case QueueItemStatus.COMPLETED:
        return {
          icon: "checkmark-circle-outline",
          color: "#0D0D0D", // enaleia-black
          text: "Completed"
        };
      default:
        return {
          icon: "help-circle-outline",
          color: "#0D0D0D", // enaleia-black
          text: "Unknown"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`flex-row items-center  gap-1 ${className}`}>
    <Text className="text-xs font-dm-regular text-grey-6">
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