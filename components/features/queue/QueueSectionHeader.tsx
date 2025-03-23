import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface QueueSectionHeaderProps {
  title: string;
  showClearOption?: boolean;
  onClear?: () => void;
  badgeCount?: number;
  badgeColor?: string;
}

const QueueSectionHeader = ({
  title,
  showClearOption = false,
  onClear,
  badgeCount,
  badgeColor = "bg-red-500",
}: QueueSectionHeaderProps) => {
  const [showClearButtons, setShowClearButtons] = useState(false);

  const handleClear = () => {
    onClear?.();
    setShowClearButtons(false);
  };

  return (
    <View className="flex-1 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Text className="text-xl font-dm-bold text-enaleia-black">{title}</Text>
        {badgeCount !== undefined && (
          <View
            className={`${badgeColor} rounded-full w-6 h-6 flex items-center justify-center ml-2`}
          >
            <Text className="text-white text-xs font-dm-medium">
              {badgeCount}
            </Text>
          </View>
        )}
      </View>
      {showClearOption && (
        showClearButtons ? (
          <View className="flex-row gap-1.5 items-center">
            <Pressable
              onPress={() => setShowClearButtons(false)}
              className="h-6 flex-row items-center justify-center gap-1 px-2 bg-white rounded-3xl border border-grey-4"
            >
              <Text className="text-sm font-dm-light text-enaleia-black leading-[16.8px]">
                Cancel
              </Text>
              <Ionicons name="close" size={16} color="#0D0D0D" />
            </Pressable>
            <Pressable
              onPress={handleClear}
              className="h-6 flex-row items-center justify-center gap-1 px-2 bg-red-500 rounded-3xl"
            >
              <Text className="text-sm font-dm-light text-white leading-[16.8px]">
                Clear
              </Text>
              <Ionicons name="checkmark" size={16} color="white" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowClearButtons(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="flex items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="#0D0D0D" />
          </Pressable>
        )
      )}
    </View>
  );
};

export default QueueSectionHeader; 