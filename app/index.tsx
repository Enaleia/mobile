import SafeAreaContent from "@/components/SafeAreaContent";
import { useTaskActionsQuery } from "@/lib/queries";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { AnimatePresence, View as MotiView } from "moti";

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
        <AnimatePresence>
          <FlatList
            data={data.task_action}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ opacity: 0, translateX: -10 }}
                transition={{ delay: index * 60, type: "spring" }}
                className="mt-4 text-base"
              >
                <Text className="font-bold text-lg">{item.Task_name}</Text>
                <Text>Type: {item.Task_type}</Text>
                <Text>Role: {item.task_role}</Text>
              </MotiView>
            )}
          />
        </AnimatePresence>
      )}

      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
