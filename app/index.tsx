import { useCountries } from "@/api/country/get-countries";
import CountryForm from "@/components/CountryForm";
import LocationDisplay from "@/components/LocationDisplay";
import SafeAreaContent from "@/components/SafeAreaContent";
import { useRouter } from "expo-router";
import { Button } from "react-native";
import React, { useState, useRef } from "react";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import BottomSheetScreen from "./(tabs)/bottomsheet";

import { StatusBar } from "expo-status-bar";
import { AnimatePresence, View as MotiView } from "moti";
import { FlatList, Text, View } from "react-native";

const App = () => {
  const { data, isLoading, error } = useCountries();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = () => {
    bottomSheetModalRef.current?.present();
  };

  if (error && !isLoading) console.log({ error });

  return (
    <BottomSheetModalProvider>
      <SafeAreaContent>
        <View>
          <Text className="text-3xl font-bold">ENALEIA</Text>
          <Text className="text-lg">
            Removing plastic from the ocean, one fisherman's boat at a time.
          </Text>
        </View>
        <LocationDisplay />

        <Button title="Show Bottom Sheet" onPress={handlePresentModalPress} />

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={["25%", "50%", "75%"]}
        >
          <BottomSheetScreen />
        </BottomSheetModal>

        {isLoading && <Text>Loading countries...</Text>}
        {error && <Text>Error loading countries: {error.message}</Text>}
        {data && (
          <AnimatePresence>
            <FlatList
              data={data.Country}
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
    </BottomSheetModalProvider>
  );
};

export default App;
