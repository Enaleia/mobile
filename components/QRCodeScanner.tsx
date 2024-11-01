import { CameraView, useCameraPermissions } from "expo-camera";
import React from "react";
import { Button, Text, View } from "react-native";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    onScan(data);
  };

  if (!permission) {
    return (
      <Text className="text-center p-4">Requesting camera permission</Text>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 flex-col justify-center items-center">
        <Text className="text-center p-4">
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-col justify-center">
      <CameraView
        facing={"back"}
        className="flex-1"
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <Button title="Close Scanner" onPress={onClose} />
      </View>
    </View>
  );
};

export default QRCodeScanner;
