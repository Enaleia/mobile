import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  locationService,
  SavedLocation,
  LocationData,
} from "@/services/locationService";
import ModalBase from "@/components/shared/ModalBase";
import { useEffect, useState } from "react";

interface SavedLocationsSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  currentLocationId?: string;
}

export function SavedLocationsSelector({
  isVisible,
  onClose,
  onSelect,
  currentLocationId,
}: SavedLocationsSelectorProps) {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const locations = await locationService.getSavedLocations();
        setSavedLocations(locations);
      } catch (error) {
        console.error("Failed to load saved locations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isVisible) {
      loadLocations();
    }
  }, [isVisible]);

  const handleSelect = async (saved: SavedLocation) => {
    // Check if this location is already selected
    if (saved.id === currentLocationId) {
      Alert.alert(
        "Already Selected",
        "This location is already selected for this event.",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }

    const location: LocationData = {
      coords: saved.coords,
      timestamp: Date.now(),
      savedLocationId: saved.id,
    };

    onSelect(location);
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="flex-1 bg-white rounded-t-3xl">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold text-center">Saved Locations</Text>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0D0D0D" />
          </View>
        ) : savedLocations.length === 0 ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-center text-gray-500">
              No saved locations found
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1">
            {savedLocations.map((location) => (
              <Pressable
                key={location.id}
                onPress={() => handleSelect(location)}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <Ionicons name="location-outline" size={24} color="#0D0D0D" />
                <View className="ml-3">
                  <Text className="font-bold">{location.name}</Text>
                  <Text className="text-sm text-gray-500">
                    {location.coords.latitude.toFixed(6)},{" "}
                    {location.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </ModalBase>
  );
}
