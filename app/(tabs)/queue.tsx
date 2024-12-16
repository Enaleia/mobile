import { IEvent } from "@/api/events/new";
import SafeAreaContent from "@/components/SafeAreaContent";
import { ACTION_ICONS } from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";

const QueuedAction = ({ type, date }: { type: ActionTitle; date: string }) => {
  return (
    <View
      className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200"
      style={{ borderLeftWidth: 4 }}
    >
      <View className="flex-row items-center justify-center gap-2">
        <Image source={ACTION_ICONS[type]} className="w-8 h-8" />
        <View className="space-y-0.5">
          <Text className="text-base font-dm-bold text-neutral-800 tracking-tighter">
            {type}
          </Text>
          <Text className="text-xs font-dm-regular text-neutral-600 uppercase w-full">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(date))}
          </Text>
        </View>
      </View>
    </View>
  );
};

const QueueScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: incompleteActions } = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      queryClient
        .getQueryData<IEvent[]>(["events"])
        ?.filter((event) => event.isNotSynced) || [],
    staleTime: Infinity,
  });

  useEffect(() => {
    // Update the tab bar badge with number of incomplete actions
    navigation.setOptions({
      tabBarBadge: incompleteActions?.length || undefined,
    });
  }, [incompleteActions]);

  const QUEUE_ACTIONS_SORTED = (incompleteActions || []).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <SafeAreaContent>
      <Text className="text-3xl font-dm-regular text-neutral-800 tracking-[-1px] mb-3">
        Queue
      </Text>
      <View className="flex-1">
        {QUEUE_ACTIONS_SORTED.length > 0 ? (
          QUEUE_ACTIONS_SORTED.map((action) => (
            <QueuedAction
              key={action.localId}
              type={action.type}
              date={action.date}
            />
          ))
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
