import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text } from "react-native";

interface ErrorMessageProps {
  /**
   * The error message to display
   */
  message: string;

  /**
   * Optional secondary message or instructions
   */
  secondaryMessage?: string;

  /**
   * Optional additional class names for the container
   */
  className?: string;
}

/**
 * A reusable error message component that displays an error with an icon
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  secondaryMessage = "Please try again or contact support if the problem persists.",
  className = "",
}) => {
  return (
    <View
      className={`flex-row items-center bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}
    >
      <View className="bg-red-100 rounded-full p-1 mr-2">
        <Ionicons name="alert-circle" size={20} color="#EF4444" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-dm-medium text-red-700">{message}</Text>
        {secondaryMessage && (
          <Text className="text-xs font-dm-regular text-red-600 mt-1">
            {secondaryMessage}
          </Text>
        )}
      </View>
    </View>
  );
};

export default ErrorMessage;
