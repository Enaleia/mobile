import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View, FlatList } from "react-native";
import { useRouter } from "expo-router";
import SafeAreaContent from "@/components/SafeAreaContent";
import { useTaskActionsQuery } from "@/lib/queries";

const App = () => {
  const router = useRouter();
  const { data, isLoading, error } = useTaskActionsQuery();
  if (error && !isLoading) console.log(error);

  return (
    <SafeAreaContent>
      <View>
        <Text className="text-3xl font-bold">ENALEIA</Text>
        <Text className="text-lg">
          Removing plastic from the ocean, one fisherman's boat at a time.
        </Text>
      </View>

      {isLoading && <Text>Loading task actions...</Text>}
      {error && <Text>Error loading task actions: {error.message}</Text>}
      {data && (
        <FlatList
          data={data.task_action}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="mt-4">
              <Text className="font-bold">{item.Task_name}</Text>
              <Text>Type: {item.Task_type}</Text>
              <Text>Role: {item.task_role}</Text>
            </View>
          )}
        />
      )}

      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
