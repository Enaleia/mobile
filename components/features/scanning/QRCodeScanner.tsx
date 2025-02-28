import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraEducationalModal } from "./CameraEducationalModal";
import * as Haptics from "expo-haptics";

const CAMERA_PERMISSION_SEEN_KEY = "@camera_permission_seen";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const scanLineAnimation = React.useRef(new Animated.Value(0)).current;
  const [showEducationalModal, setShowEducationalModal] = useState(false);

  useEffect(() => {
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

    checkFirstTime();
  }, []);

  // Re-check permission status when component mounts or permission changes
  useEffect(() => {
    if (permission) {
      checkFirstTime();
    }
  }, [permission?.granted]);

  const checkFirstTime = async () => {
    const hasSeenPermissionModal = await AsyncStorage.getItem(
      CAMERA_PERMISSION_SEEN_KEY
    );

    // Only consider it "seen" if they've actually granted permission
    if (!hasSeenPermissionModal || !permission?.granted) {
      setShowEducationalModal(true);
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data) {
      // Trigger success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        (error) => console.log("Haptic feedback error:", error)
      );

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
      <CameraEducationalModal
        isVisible={showEducationalModal}
        onClose={() => setShowEducationalModal(false)}
        onRequestPermission={handleRequestPermission}
        onSkip={onClose}
      />
    );
  }

  return (
    <>
      <CameraEducationalModal
        isVisible={showEducationalModal}
        onClose={() => setShowEducationalModal(false)}
        onRequestPermission={handleRequestPermission}
        onSkip={onClose}
      />
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
    </>
  );
};

export default QRCodeScanner;
