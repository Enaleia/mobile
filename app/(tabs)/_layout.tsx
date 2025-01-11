import { IEvent } from "@/api/events/new";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router/tabs";
import React from "react";
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
        tabBarIconStyle: {
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          href: "/",
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          tabBarLabel: "Queue",
          tabBarBadge: incompleteActions?.length || undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="archive" size={24} color={color} />
          ),
          href: "/queue",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
          href: "/settings",
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
