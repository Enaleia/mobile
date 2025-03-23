import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ServiceStatus } from "@/types/queue";
import { MotiView } from "moti";

interface ServiceStatusIndicatorProps {
  status: ServiceStatus;
  type: "directus" | "eas";
  extraClasses?: string;
}

const ServiceStatusIndicator = ({
  status,
  type,
  extraClasses = "",
}: ServiceStatusIndicatorProps) => {
  const isActive = status === ServiceStatus.PROCESSING;
  const isCompleted = status === ServiceStatus.COMPLETED;
  const isFailed = status === ServiceStatus.FAILED;

  const getStatusColor = () => {
    if (isActive) return "#0D9BFF";
    if (isCompleted) return "#22c55e";
    if (isFailed) return "#ef4444";
    return "#f59e0b";
  };

  const getStatusIcon = () => {
    if (isActive) return "sync-circle";
    if (isCompleted) return "checkmark-circle";
    if (isFailed) return "close-circle";
    return "time";
  };

  return (
    <View className={`flex-row items-center ${extraClasses}`}>
      {isActive ? (
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
        >
          <Ionicons
            name={getStatusIcon()}
            size={16}
            color={getStatusColor()}
          />
        </MotiView>
      ) : (
        <Ionicons
          name={getStatusIcon()}
          size={16}
          color={getStatusColor()}
        />
      )}
      <Text className="text-xs ml-1 text-black">
        {type === "directus" ? "Database" : "Blockchain"}
      </Text>
    </View>
  );
};

export default ServiceStatusIndicator; 