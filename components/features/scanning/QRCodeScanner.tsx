import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  Pressable,
  Text,
  View,
  Linking,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const scanLineAnimation = React.useRef(new Animated.Value(0)).current;
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

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
  }, []);

  const requestCameraPermission = async () => {
    if (isRequestingPermission) return;
    
    setIsRequestingPermission(true);
    try {
      const { status: currentStatus } = await Camera.getCameraPermissionsAsync();
      
      if (currentStatus === 'denied') {
        // If already denied, open settings
        await Linking.openSettings();
      } else {
        // Request permission directly
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status === 'denied') {
          // If user denies in the modal, give them option to open settings
          await Linking.openSettings();
        }
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Initial permission check
  useEffect(() => {
    const checkInitialPermission = async () => {
      if (!permission?.granted && !isRequestingPermission) {
        const { status } = await Camera.getCameraPermissionsAsync();
        if (status !== 'granted') {
          await Camera.requestCameraPermissionsAsync();
        }
      }
    };
    
    checkInitialPermission();
  }, []);

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

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center p-4 space-y-6 bg-white-sand">
        <View className="items-center space-y-4">
          <View className="bg-white/80 rounded-full p-6 mb-2">
            <Ionicons name="camera-outline" size={48} color="#0D0D0D" />
          </View>
          <Text className="text-center text-xl font-dm-bold text-enaleia-black px-4">
            Camera permission is turned off
          </Text>
          <Text className="text-center text-base font-dm-regular text-gray-600 px-8">
            To use this feature, allow access to your camera
          </Text>
        </View>
        <View className="space-y-3 w-full px-4">
          <Pressable
            onPress={requestCameraPermission}
            className="bg-blue-ocean px-6 py-4 rounded-full w-full"
          >
            <Text className="text-white font-dm-bold text-center text-base">
              Enable Camera
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="px-6 py-4"
          >
            <Text className="text-enaleia-black font-dm-regular text-center text-base">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 flex-col justify-center"
      accessibilityRole="none"
      accessibilityLabel="QR Code Scanner"
    >
      <View className="flex-row items-center justify-between bg-white-sand p-4">
        <Text
          className="text-sm font-dm-bold text-enaleia-black tracking-tighter"
          accessibilityRole="header"
        >
          Point the camera at a QR code
        </Text>
      </View>

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
          className="bg-white min-w-[60px] px-6 py-3 rounded-3xl flex flex-row items-center justify-center mx-1 my-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          accessibilityHint="Double tap to close QR code scanner"
        >
          <Text className="text-sm font-dm-bold text-enaleia-black tracking-tighter text-center">
            Close scanner
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default QRCodeScanner;
