import { ACTION_ICONS } from "@/constants/action";
import { useActions } from "@/hooks/data/useActions";
import { QueueItem } from "@/types/queue";
import { View, Text, Image } from "react-native";

const QueuedAction = ({ item }: { item: QueueItem }) => {
  const { actionsData } = useActions();
  const action = actionsData?.find((a) => a.id === item.actionId);

  if (!action) return null;

  return (
    <View className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200">
      <View className="flex-row items-center justify-center gap-2">
        <Image source={ACTION_ICONS[action.name]} className="w-8 h-8" />
        <View className="space-y-0.5">
          <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
            {action.name}
          </Text>
          <Text className="text-xs font-dm-medium text-slate-500 uppercase w-full">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            }).format(new Date(item.date))}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QueuedAction;
