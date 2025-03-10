import { CameraView } from "expo-camera";
import React from "react";
import {
  Pressable,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data) {
      onScan(data);
      onClose();
    }
  };

  return (
    <View
      className="flex-1 flex-col justify-center"
      accessibilityRole="none"
      accessibilityLabel="QR Code Scanner"
    >
      <View
        className="flex-1 relative"
        accessibilityRole="image"
        accessibilityLabel="Camera view for QR scanning"
      >
        <CameraView
          facing={"back"}
          className="flex-1"
          onBarcodeScanned={handleBarCodeScanned}
          accessibilityLabel="QR code camera view"
          accessibilityHint="Point camera at QR code to scan"
        />
      </View>
      <View className="absolute top-12 right-4">
        <Pressable
          className="bg-black w-10 h-10 rounded-full flex items-center justify-center"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          accessibilityHint="Double tap to close QR code scanner"
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

export default QRCodeScanner;
