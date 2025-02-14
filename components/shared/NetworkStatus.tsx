import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "@/contexts/NetworkContext";

const NetworkStatus = () => {
  const { isConnected, connectionType, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  return (
    <View className="flex-row items-center justify-center px-2 py-1 space-x-1 bg-sand-beige rounded-full w-fit max-w-[120px]">
      <Ionicons
        name={connectionType === "wifi" ? "wifi" : "cellular"}
        size={14}
        color={isOnline ? "#22c55e" : "#ef4444"}
      />
      <Text className="text-xs font-dm-medium text-enaleia-black">
        {isOnline ? `Online (${connectionType})` : "Offline"}
      </Text>
    </View>
  );
};

export default NetworkStatus;
