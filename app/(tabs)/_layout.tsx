import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import React from "react";
import { INCOMPLETE_ACTIONS } from "./queue";

const TabsLayout = () => {
  const { data: incompleteActions } = useQuery({
    queryKey: ["incompleteActions"],
    queryFn: () => Promise.resolve(INCOMPLETE_ACTIONS),
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
          tabBarBadge:
            incompleteActions?.length && incompleteActions?.length > 0
              ? incompleteActions?.length
              : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" size={24} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="attestations"
        options={{
          tabBarLabel: "Attestations",
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={24} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
};

export default TabsLayout;
