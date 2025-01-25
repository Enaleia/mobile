import { QueueItem } from "@/types/queue";
import { View, Text, Pressable } from "react-native";
import QueuedAction from "@/components/features/queue/QueueAction";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[]) => void;
}

const QueueSection = ({ title, items, onRetry }: QueueSectionProps) => {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-dm-bold">{title}</Text>
        <Pressable
          onPress={() => onRetry(items)}
          className="bg-blue-500 px-3 py-1 rounded-full"
        >
          <Text className="text-white font-dm-medium">Retry All</Text>
        </Pressable>
      </View>
      {items.map((item) => (
        <QueuedAction key={item.localId} type={item.type} date={item.date} />
      ))}
    </View>
  );
};

export default QueueSection;
