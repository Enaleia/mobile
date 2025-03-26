import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueueItemStatus, isCompletelyFailed } from "@/types/queue";
import { Text } from "react-native";

interface QueueStatusIndicatorProps {
  status: QueueItemStatus;
  item?: any; // Add item prop to check if completely failed
  className?: string;
}

export default function QueueStatusIndicator({ status, item, className = "" }: QueueStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case QueueItemStatus.PENDING:
        return {
          icon: "time",
          color: "#737373", // grey-400
          text: "Pending"
        };
      case QueueItemStatus.PROCESSING:
        return {
          icon: "sync",
          color: "#737373", // grey-400
          text: "Processing"
        };
      case QueueItemStatus.FAILED:
        // Check if item is completely failed
        if (item && isCompletelyFailed(item)) {
          return {
            icon: "alert-circle",
            color: "#f43f5e", // rose-500 (red)
            text: "Contact support"
          };
        } else {
          return {
            icon: "time",
            color: "#737373", // grey-400
            text: "Auto-retry soon"
          };
        }
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