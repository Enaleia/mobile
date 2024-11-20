import LocationDisplay from "@/components/LocationDisplay";
import LoginForm from "@/components/LoginForm";
import QRCodeScanner from "@/components/QRCodeScanner";
import SafeAreaContent from "@/components/SafeAreaContent";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, Text, View } from "react-native";

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
        <View className="p-4 font-dm-regular">
          <View className="mb-4">
            <Text
              className="text-3xl font-dm-bold"
              style={{ letterSpacing: -1.5 }}
            >
              Enaleia
            </Text>
            <Text className="text-base" style={{ lineHeight: 24 }}>
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

          <Link href="/login">Login</Link>
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaContent>
  );
};

export default App;
