import { CameraView, useCameraPermissions } from "expo-camera";
import React from "react";
import {
  Animated,
  Button,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const scanLineAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const screenHeight = Dimensions.get("window").height;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: screenHeight * 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data) {
      onScan(data);
      onClose();
    }
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
    <View
      className="flex-1 flex-col justify-center"
      accessibilityRole="none"
      accessibilityLabel="QR Code Scanner"
    >
      <Text
        className="text-center p-4 text-sm font-dm-bold text-enaleia-black tracking-tighter bg-white-sand"
        accessibilityRole="header"
      >
        Point the camera at a QR code
      </Text>

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
        <Animated.View
          style={{
            transform: [{ translateY: scanLineAnimation }],
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "#2985D0",
            opacity: 0.7,
          }}
        />
      </View>
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <Pressable
          className="bg-blue-ocean min-w-[60px] px-3 py-2 rounded-3xl flex flex-row items-center justify-center mx-1 my-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          accessibilityHint="Double tap to close QR code scanner"
        >
          <Text className="text-sm font-dm-bold text-white tracking-tighter text-center">
            Close scanner
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default QRCodeScanner;
