import { Stack } from "expo-router";
import React from "react";

export default function FormsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="new-collection"
        options={{
          title: "New Collection",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          animation: "simple_push",
          headerStyle: {
            backgroundColor: "#1a4ba7", // Darker blue with better contrast
          },
          headerTintColor: "#ffffff",
          statusBarColor: "#1a4ba7",
          statusBarStyle: "inverted",
        }}
      />
      {/* Add other form routes here as needed */}
    </Stack>
  );
}
