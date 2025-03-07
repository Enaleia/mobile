import { View, Text, Pressable } from "react-native";
import ModalBase from "@/components/shared/ModalBase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CAMERA_PERMISSION_SEEN_KEY = "@camera_permission_seen";

const CAMERA_POINTS = [
  {
    icon: "qr-code",
    title: "Scan QR Codes",
    description:
      "Quickly scan QR codes to fill in required information for attestation forms",
  },
  {
    icon: "shield-checkmark",
    title: "Privacy First",
    description:
      "Camera is only used when scanning QR codes and never records or stores images",
  },
];

interface CameraEducationalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
}

export function CameraEducationalModal({
  isVisible,
  onClose,
  onRequestPermission,
}: CameraEducationalModalProps) {
  const handleDismiss = async () => {
    onClose();
  };

  const handleRequestPermission = async () => {
    await AsyncStorage.setItem(CAMERA_PERMISSION_SEEN_KEY, "true");
    onRequestPermission();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="p-4 space-y-6">
        <View className="items-center">
          <View className="bg-blue-50 rounded-full p-4 mb-4">
            <Ionicons name="camera" size={24} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-dm-bold text-enaleia-black tracking-tighter text-center mb-2">
            Camera Access for QR Scanning
          </Text>
          <Text className="text-base font-dm-regular text-gray-600 text-center">
            Allow Enaleia to access your camera to scan QR codes for attestation
            forms
          </Text>
        </View>

        <View className="space-y-4">
          {CAMERA_POINTS.map((point) => (
            <View className="flex-row items-start space-x-3" key={point.title}>
              <View className="bg-green-50 rounded-full p-2 mt-1">
                <Ionicons name={point.icon as any} size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-dm-medium text-enaleia-black mb-1">
                  {point.title}
                </Text>
                <Text className="text-sm font-dm-regular text-gray-600">
                  {point.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="space-y-3 pt-4">
          <Pressable
            onPress={handleRequestPermission}
            className="bg-blue-ocean p-3 rounded-full"
          >
            <Text className="text-base font-dm-bold tracking-tight text-white text-center">
              Enable Camera
            </Text>
          </Pressable>

          <Pressable onPress={handleSkip} className="p-3">
            <Text className="text-base font-dm-regular text-gray-600 text-center">
              Skip for Now
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}
