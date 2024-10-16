import { useCountries } from "@/api/country/get-countries";
import CountryForm from "@/components/CountryForm";
import SafeAreaContent from "@/components/SafeAreaContent";

import { StatusBar } from "expo-status-bar";
import { AnimatePresence, View as MotiView } from "moti";
import React from "react";
import { FlatList, Text, View } from "react-native";

const App = () => {
  const { data, isLoading, error } = useCountries();
  if (error && !isLoading) console.log({ error });

  return (
    <SafeAreaContent>
      <View>
        <Text className="text-3xl font-bold">ENALEIA</Text>
        <Text className="text-lg">
          Removing plastic from the ocean, one fisherman's boat at a time.
        </Text>
      </View>

      {isLoading && <Text>Loading countries...</Text>}
      {error && <Text>Error loading countries: {error.message}</Text>}
      {data && (
        <AnimatePresence>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ opacity: 0, translateX: -10 }}
                transition={{ delay: index * 60, type: "spring" }}
                className="mt-4 text-base"
              >
                <Text className="font-bold text-lg">{item.Country}</Text>
              </MotiView>
            )}
          />
        </AnimatePresence>
      )}
      <CountryForm />
      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
