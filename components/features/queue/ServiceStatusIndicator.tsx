import { ServiceStatus } from "@/types/queue";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface ServiceStatusIndicatorProps {
  status: ServiceStatus;
  type: "directus" | "eas" | "linking";
  extraClasses?: string;
  textClassName?: string;
  iconSize?: number;
}

export const ServiceStatusIndicator = ({
  status,
  type,
  extraClasses,
  textClassName,
  iconSize = 16,
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
        return "#8E8E93"; // gray-500
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
    <View className={`flex-row items-center justify-left gap-0.5 ${extraClasses || ''}`}>
      <Ionicons name={getStatusIcon()} size={iconSize} color={getStatusColor()} />
      <Text className={`text-xs text-grey-6 ${textClassName || ''}`}>
        {getLabel()}
      </Text>
    </View>
  );
}; 