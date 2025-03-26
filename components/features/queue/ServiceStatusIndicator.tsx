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
  const getStatusIcon = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "checkmark-circle-outline";
      case ServiceStatus.FAILED:
        return "alert-circle-outline";
      case ServiceStatus.PROCESSING:
        return "sync-circle-outline";
      case ServiceStatus.OFFLINE:
        return "cloud-offline-outline";
      case ServiceStatus.PENDING:
        return "time-outline";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "#059669"; // emerald-600
      case ServiceStatus.FAILED:
        return "#f43f5e"; // rose-500
      case ServiceStatus.PROCESSING:
        return "#f59e0b"; // amber-500
      case ServiceStatus.OFFLINE:
        return "#a3a3a3"; // gray-500
      case ServiceStatus.PENDING:
        return "#a3a3a3"; // gray-500 for all pending states
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
    <View className={`flex-row items-center justify-left gap-1 ${extraClasses}`}>
      <Ionicons name={getStatusIcon()} size={22} color={getStatusColor()} />
      <Text className="text-xs text-grey-6">
        {getLabel()}
      </Text>
    </View>
  );
}; 