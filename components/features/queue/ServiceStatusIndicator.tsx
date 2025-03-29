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
      case ServiceStatus.INCOMPLETE:
        return "ellipse-outline";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return "#059669"; // emerald-600
      case ServiceStatus.INCOMPLETE:
        return "#6B7280"; // gray-500
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