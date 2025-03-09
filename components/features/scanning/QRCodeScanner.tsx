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
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);


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
      <View className="absolute top-16 right-8">
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
