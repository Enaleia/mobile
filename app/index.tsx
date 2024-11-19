import LoginForm from "@/components/LoginForm";
import SafeAreaContent from "@/components/SafeAreaContent";
import QRCodeScanner from "@/components/QRCodeScanner";
import LocationDisplay from "@/components/LocationDisplay";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Text, View, Button } from "react-native";

const App = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);

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
        <View className="p-4 font-sans">
          <View className="mb-4">
            <Text className="text-3xl font-bold mb-2">ENALEIA</Text>
            <Text className="text-lg">
              Removing plastic from the ocean, one fisherman's boat at a time.
            </Text>
          </View>
          <LocationDisplay />
          <LoginForm />

          <View className="my-4">
            <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />
          </View>

          {scannedData && (
            <Text className="mt-4 p-2 bg-gray-100 rounded">
              Scanned QR Code: {scannedData}
            </Text>
          )}
        </View>
      )}
      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
