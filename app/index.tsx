import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View } from "react-native";

import { useRouter } from "expo-router";
import SafeAreaContent from "@/components/SafeAreaContent";

const App = () => {
  const router = useRouter();
  return (
    <SafeAreaContent>
      <View>
        <Text className="text-3xl font-bold">ENALEIA</Text>
        <Text className="text-lg">
          Removing plastic from the ocean, one fisherman's boat at a time.
        </Text>
      </View>

      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
