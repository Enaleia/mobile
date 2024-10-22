import { useCountries } from "@/api/country/get-countries";
import CountryForm from "@/components/CountryForm";
import LocationDisplay from "@/components/LocationDisplay";
import SafeAreaContent from "@/components/SafeAreaContent";
import QRCodeScanner from "@/components/QRCodeScanner";

import { StatusBar } from "expo-status-bar";
import { AnimatePresence, View as MotiView } from "moti";
import React, { useState } from "react";
import { FlatList, Text, View, Button } from "react-native";

const App = () => {
  const { data, isLoading, error } = useCountries();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);

  if (error && !isLoading) console.log({ error });

  const handleScan = (data: string) => {
    setScannedData(data);
    setShowScanner(false);
  };

  return (
    <SafeAreaContent>
      {showScanner ? (
        <QRCodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <View className="p-4">
          <View className="mb-4">
            <Text className="text-3xl font-bold mb-2">ENALEIA</Text>
            <Text className="text-lg">
              Removing plastic from the ocean, one fisherman's boat at a time.
            </Text>
          </View>
          <LocationDisplay />

          <View className="my-4">
            <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />
          </View>

          {scannedData && (
            <Text className="mt-4 p-2 bg-gray-100 rounded">
              Scanned QR Code: {scannedData}
            </Text>
          )}

          {isLoading && <Text className="mt-4">Loading countries...</Text>}
          {error && (
            <Text className="mt-4 text-red-500">
              Error loading countries: {error.message}
            </Text>
          )}
          {data && (
            <AnimatePresence>
              <FlatList
                className="mt-4"
                data={data.Country}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <MotiView
                    from={{ opacity: 0, translateX: -10 }}
                    animate={{ translateX: 0, opacity: 1 }}
                    exit={{ opacity: 0, translateX: -10 }}
                    transition={{ delay: index * 60, type: "spring" }}
                    className="mb-2"
                  >
                    <Text className="font-bold text-lg">{item.Country}</Text>
                  </MotiView>
                )}
              />
            </AnimatePresence>
          )}
          <CountryForm />
        </View>
      )}
      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
