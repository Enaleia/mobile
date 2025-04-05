import { CameraView } from "expo-camera";
import React, { useState } from "react";
import {
  Pressable,
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [isReady, setIsReady] = useState(false);
  const [flash, setFlash] = useState<"on" | "off">("off");

  const onCameraReady = () => {
    setIsReady(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data) {
      onScan(data);
      onClose();
    }
  };

  return (
    <View
      className="flex-1 flex-col justify-center bg-black"
      accessibilityRole="none"
      accessibilityLabel="QR Code Scanner"
    >
      <StatusBar barStyle="light-content" />
      <View
        className="flex-1 relative"
        accessibilityRole="image"
        accessibilityLabel="Camera view for QR scanning"
      >
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash === "on"}
          onCameraReady={onCameraReady}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={isReady ? handleBarCodeScanned : undefined}
          accessibilityLabel="QR code camera view"
          accessibilityHint="Point camera at QR code to scan"
        />
        {!isReady && (
          <View className="absolute inset-0 items-center justify-center bg-black">
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
      </View>
      <View className="absolute top-12 right-4">
        <Pressable
          className="bg-black/50 backdrop-blur-lg w-10 h-10 rounded-full flex items-center justify-center"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          accessibilityHint="Tap to close QR code scanner"
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
      </View>
      <View className="absolute bottom-16 left-0 right-0 items-center">
        <Pressable
          className="bg-black/50 backdrop-blur-lg w-12 h-12 rounded-full flex items-center justify-center"
          onPress={() => setFlash(flash === "on" ? "off" : "on")}
          accessibilityRole="button"
          accessibilityLabel="Toggle flash"
          accessibilityHint="Double tap to toggle camera flash"
        >
          <Ionicons 
            name={flash === "on" ? "flash" : "flash-off"} 
            size={24} 
            color="white" 
          />
        </Pressable>
      </View>
    </View>
  );
};

export default QRCodeScanner;
