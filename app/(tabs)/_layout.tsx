import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/tabs";
import React from "react";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItemStatus } from "@/types/queue";

const TabsLayout = () => {
  const { queueItems } = useQueue();

  const incompleteItems = queueItems.filter(
    (item) => item.status !== QueueItemStatus.COMPLETED
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#24548b",
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
          tabBarBadge: incompleteItems.length || undefined,
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
