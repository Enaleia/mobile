import SafeAreaContent from "@/components/SafeAreaContent";
import { ACTION_COLORS, ACTION_ICONS } from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";

type QueueStatus = "Awaiting network" | "Uploading" | "Completed";

const QUEUE_ACTIONS: {
  title: ActionTitle;
  date: string;
  status: QueueStatus;
}[] = [
  { title: "Fishing for litter", date: "Dec 15, 2024", status: "Uploading" },
  { title: "Sorting", date: "Jan 3, 2025", status: "Awaiting network" },
  { title: "Beach Cleanup", date: "Feb 12, 2025", status: "Completed" },
  { title: "Pelletizing", date: "Nov 28, 2024", status: "Awaiting network" },
  { title: "Washing", date: "Dec 1, 2024", status: "Completed" },
  { title: "Prevention", date: "Jan 20, 2025", status: "Uploading" },
  { title: "Manufacturing", date: "Nov 10, 2024", status: "Awaiting network" },
];

const QUEUE_STATUS_CATEGORIES: Record<QueueStatus, typeof QUEUE_ACTIONS> = {
  "Awaiting network": QUEUE_ACTIONS.filter(
    (action) => action.status === "Awaiting network"
  ),
  Uploading: QUEUE_ACTIONS.filter((action) => action.status === "Uploading"),
  Completed: QUEUE_ACTIONS.filter((action) => action.status === "Completed"),
};

const INCOMPLETE_ACTIONS = QUEUE_ACTIONS.filter(
  (action) => action.status !== "Completed"
).length;

const QUEUE_ACTION_STATUS_COLORS = {
  "Awaiting network": "bg-amber-200 text-amber-600 border-amber-300",
  Uploading: "bg-blue-200 text-blue-600 border-blue-300",
  Completed: "bg-green-200 text-green-600 border-green-300",
};

const QueuedAction = ({
  title,
  date,
  status,
}: {
  title: ActionTitle;
  date: string;
  status: QueueStatus;
}) => {
  return (
    <View
      className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200"
      style={{ borderLeftWidth: 4, borderLeftColor: ACTION_COLORS[title] }}
    >
      <View className="flex-row items-center justify-center gap-2">
        <Image source={ACTION_ICONS[title]} className="w-8 h-8" />
        <View className="space-y-0.5">
          <Text className="text-base font-dm-bold text-neutral-800 tracking-tighter">
            {title}
          </Text>
          <Text className="text-xs font-dm-regular text-neutral-600 uppercase w-full">
            {date}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-center gap-1">
        <Text
          className={`text-xs font-dm-medium px-2 py-0.5 rounded-md text-center border-[1.5px] ${QUEUE_ACTION_STATUS_COLORS[status]}`}
        >
          {status}
        </Text>
      </View>
    </View>
  );
};

const QueueScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Update the tab bar badge with number of incomplete actions
    navigation.setOptions({
      tabBarBadge: INCOMPLETE_ACTIONS > 0 ? INCOMPLETE_ACTIONS : undefined,
    });
  }, [INCOMPLETE_ACTIONS]);

  const QUEUE_ACTIONS_SORTED = Array.from(QUEUE_ACTIONS).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <SafeAreaContent>
      <Text className="text-3xl font-dm-regular text-neutral-800 tracking-[-1px] mb-3">
        Queue
      </Text>
      <View className="flex-1">
        {QUEUE_ACTIONS_SORTED.length > 0 ? (
          Object.entries(QUEUE_STATUS_CATEGORIES).map(
            ([status, actions]) =>
              actions.length > 0 && (
                <View key={status}>
                  <Text className="text-base font-dm-medium text-slate-600 tracking-tight mb-1">
                    {status}
                  </Text>
                  <View className="bg-slate-50 rounded-md overflow-hidden mb-6">
                    <ScrollView>
                      {actions.map((action) => (
                        <QueuedAction key={action.title} {...action} />
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )
          )
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="albums-outline" size={64} color="#475569" />
            <Text className="text-lg font-dm-medium text-slate-600 tracking-tight">
              No actions in queue
            </Text>
          </View>
        )}
      </View>
    </SafeAreaContent>
  );
};

export default QueueScreen;
