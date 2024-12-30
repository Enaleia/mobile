import { IEvent } from "@/api/events/new";
import SafeAreaContent from "@/components/SafeAreaContent";
import { ACTION_ICONS } from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";

const QueuedAction = ({ type, date }: { type: ActionTitle; date: string }) => {
  return (
    <View className="flex-row items-center justify-between px-3 py-2 border-b border-neutral-200">
      <View className="flex-row items-center justify-center gap-2">
        <Image source={ACTION_ICONS[type]} className="w-8 h-8" />
        <View className="space-y-0.5">
          <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
            {type}
          </Text>
          <Text className="text-xs font-dm-medium text-slate-500 uppercase w-full">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
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

  // TODO: This is a temporary fix to clear the cache when the queue is too large
  useEffect(() => {
    // If there are more than 30 queued actions, invalidate and clear the cache
    if (QUEUE_ACTIONS_SORTED.length > 30) {
      // Clear the AsyncStorage cache
      AsyncStorage.removeItem("enaleia-cache-v0")
        .then(() => {
          // Invalidate and reset the query client
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.resetQueries({ queryKey: ["events"] });
        })
        .catch((error) => {
          console.error("Error clearing queue cache:", error);
        });
    }
  }, [QUEUE_ACTIONS_SORTED.length]);

  return (
    <SafeAreaContent>
      <Text className="text-3xl font-dm-bold text-neutral-800 tracking-[-1px] mb-3">
        Queue
      </Text>
      <Text className="text-base font-dm-regular text-neutral-600 tracking-tighter">
        Sorted by most recent
      </Text>
      <View className="h-max bg-white rounded-lg overflow-hidden">
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
