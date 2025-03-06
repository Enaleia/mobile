import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/tabs";
import React from "react";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItemStatus } from "@/types/queue";

const TabsLayout = () => {
  const { queueItems } = useQueue();

  const incompleteItems = Array.isArray(queueItems)
    ? queueItems.filter((item) => item.status !== QueueItemStatus.COMPLETED)
    : [];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0D0D0D",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
          href: "/",
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          tabBarLabel: "Queue",
          tabBarBadge: incompleteItems.length || undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "file-tray" : "file-tray-outline"} 
              size={24} 
              color={color} 
            />
          ),
          href: "/queue",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={24} 
              color={color} 
            />
          ),
          href: "/settings",
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
