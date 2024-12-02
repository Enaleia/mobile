import { Stack } from "expo-router";
import React from "react";

const FormsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="collection/new"
        options={{
          title: "New Collection",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          animation: "simple_push",
          headerStyle: {
            backgroundColor: "#24548b", // Darker blue with better contrast
          },
          headerTintColor: "#ffffff",
          statusBarStyle: "inverted",
        }}
      />
      {/* Add other form routes here as needed */}
    </Stack>
  );
};

export default FormsLayout;
