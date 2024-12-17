import { IEvent } from "@/api/events/new";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";

const TabsLayout = () => {
  const queryClient = useQueryClient();
  const { data: incompleteActions } = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      queryClient
        .getQueryData<IEvent[]>(["events"])
        ?.filter((event) => event.isNotSynced) || [],
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#24548b",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          tabBarLabel: "Queue",
          tabBarBadge: incompleteActions?.length || undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
