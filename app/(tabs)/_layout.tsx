import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/tabs";
import React from "react";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItemStatus } from "@/types/queue";
import { Icon } from "../../components/shared/Icon";

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
        tabBarInactiveTintColor: "#8E8E93",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'home-active' : 'home-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
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
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'queue-active' : 'queue-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
            />
          ),
          href: "/queue",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'settings-active' : 'settings-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
            />
          ),
          href: "/settings",
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
