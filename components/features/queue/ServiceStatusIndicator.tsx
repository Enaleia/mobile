import { ServiceStatus } from "@/types/queue";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface ServiceStatusIndicatorProps {
  status: ServiceStatus;
  type: "directus" | "eas" | "linking";
  extraClasses?: string;
}

export const ServiceStatusIndicator = ({
  status,
  type,
  extraClasses,
}: ServiceStatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "#10b981"; // green-500
      case ServiceStatus.FAILED:
        return "#f43f5e"; // red-500
      case ServiceStatus.PROCESSING:
        return "#f59e0b"; // yellow-500
      case ServiceStatus.OFFLINE:
        return "#a3a3a3"; // gray-500
      case ServiceStatus.PENDING:
        return type === "eas" ? "#f43f5e" : "#a3a3a3"; // red-500 for blockchain pending, gray-400 for others
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
      case ServiceStatus.PENDING:
        return type === "eas" ? "close-circle" : "time"; // close-circle for blockchain pending, time for others
    }
  };

  const getLabel = () => {
    switch (type) {
      case "directus":
        return "Database";
      case "eas":
        return "Blockchain";
      case "linking":
        return "Linking";
    }
  };

  return (
    <View className={`flex-row items-center gap-1 ${extraClasses}`}>
      <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
      <Text className="text-xs text-grey-6">
        {getLabel()}
      </Text>
    </View>
  );
}; 