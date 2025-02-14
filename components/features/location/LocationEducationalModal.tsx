import { View, Text, Pressable } from "react-native";
import ModalBase from "@/components/shared/ModalBase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_INTRO_KEY = "@location_intro_seen";

const LOCATION_POINTS = [
  {
    icon: "bookmark",
    title: "Save Frequent Locations",
    description:
      "Quickly select from your saved locations for faster event creation",
  },
  {
    icon: "battery-charging",
    title: "Battery Friendly",
    description:
      "We only use location when needed and optimize for battery life",
  },
  {
    icon: "shield-checkmark",
    title: "Privacy First",
    description:
      "Your location data is only used for event verification and is never shared",
  },
];

interface LocationEducationalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  onSkip: () => void;
}

export function LocationEducationalModal({
  isVisible,
  onClose,
  onRequestLocation,
  onSkip,
}: LocationEducationalModalProps) {
  const handleDismiss = async () => {
    await AsyncStorage.setItem(LOCATION_INTRO_KEY, "true");
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="p-4 space-y-6">
        <View className="items-center">
          <View className="bg-blue-50 rounded-full p-4 mb-4">
            <Ionicons name="location" size={24} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-dm-bold text-enaleia-black tracking-tighter text-center mb-2">
            Add Location to Events
          </Text>
          <Text className="text-base font-dm-regular text-gray-600 text-center">
            Help us verify where events take place and improve our impact
            tracking
          </Text>
        </View>

        <View className="space-y-4">
          {LOCATION_POINTS.map((point) => (
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
            onPress={() => {
              handleDismiss();
              onRequestLocation();
            }}
            className="bg-blue-ocean p-3 rounded-full"
          >
            <Text className="text-base font-dm-bold tracking-tight text-white text-center">
              Enable Location
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              handleDismiss();
              onSkip();
            }}
            className="p-3"
          >
            <Text className="text-base font-dm-regular text-gray-600 text-center">
              Skip for Now
            </Text>
          </Pressable>
        </View>

        <Text className="text-xs font-dm-regular text-gray-500 text-center">
          You can always change your location preferences in settings
        </Text>
      </View>
    </ModalBase>
  );
}
