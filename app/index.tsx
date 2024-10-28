import LoginForm from "@/components/LoginForm";
import SafeAreaContent from "@/components/SafeAreaContent";

import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View } from "react-native";

const App = () => {
  return (
    <SafeAreaContent>
      <View>
        <Text className="text-3xl font-bold">ENALEIA</Text>
        <Text className="text-lg">
          Removing plastic from the ocean, one fisherman's boat at a time.
        </Text>
      </View>
      <LoginForm />

      <StatusBar style="dark" />
    </SafeAreaContent>
  );
};

export default App;
