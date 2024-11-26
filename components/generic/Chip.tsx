import { Text, View } from "react-native";

type ChipProps = {
  label: string;
  // color?: string;
  textColor?: string;
  icon?: React.ReactNode;
  extraClassName?: string;
};

/**
 * A reusable Chip component that displays text with optional icon
 * @param label - The text to display in the chip
 * @param textColor - Color of the text (optional)
 * @param icon - Optional icon component to display
 * @param extraClassName - Additional CSS classes to apply to the chip (optional)
 */
export default function Chip({
  label,
  textColor = "text-neutral-700",
  icon,
  extraClassName,
}: ChipProps) {
  return (
    <View
      className={`flex-row items-center px-1 py-0.5 rounded-lg border border-neutral-300 bg-neutral-100 ${extraClassName}`}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Text className={`text-xs font-dm-medium tracking-tight ${textColor}`}>
        {label}
      </Text>
    </View>
  );
}
