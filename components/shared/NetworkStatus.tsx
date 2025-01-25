import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NetworkStatusProps {
  isConnected: boolean;
}

const NetworkStatus = ({ isConnected }: NetworkStatusProps) => {
  return (
    <View className="flex-row items-center justify-between p-4 bg-white rounded-lg mb-4">
      <View className="flex-row items-center space-x-2">
        <Ionicons
          name="wifi"
          size={24}
          color={isConnected ? "#22c55e" : "#ef4444"} // colors: green, red
        />
        <Text className="text-base font-dm-medium">
          {isConnected ? "Connected" : "Offline"}
        </Text>
      </View>
    </View>
  );
};

export default NetworkStatus;
