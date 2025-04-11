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
   * Whether to hide the secondary message
   */
  hideSecondaryMessage?: boolean;

  /**
   * Optional additional class names for the container
   */
  className?: string;
}

/**
 * A reusable error message component that displays an error message
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  secondaryMessage = "Please try again or contact support if the problem persists.",
  hideSecondaryMessage = false,
  className = "",
}) => {
  return (
    <View
      className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}
    >
      <Text className="text-sm font-dm-medium text-red-700">{message}</Text>
      {!hideSecondaryMessage && secondaryMessage && (
        <Text className="text-xs font-dm-regular text-red-500 mt-1">
          {secondaryMessage}
        </Text>
      )}
    </View>
  );
};

export default ErrorMessage;
