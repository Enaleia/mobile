import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  locationService,
  SavedLocation,
  LocationData,
} from "@/services/locationService";
import ModalBase from "@/components/shared/ModalBase";

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
  const queryClient = useQueryClient();
  const { data: savedLocations = [], isLoading } = useQuery({
    queryKey: ["savedLocations"],
    queryFn: () => locationService.getSavedLocations(),
  });

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

    // Update usage count
    try {
      await locationService.saveLocation(saved.name, location);
      queryClient.invalidateQueries({ queryKey: ["savedLocations"] });
    } catch (error) {
      console.error("Error updating location usage:", error);
    }

    onSelect(location);
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="p-4 space-y-4 bg-white rounded-lg">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-xl font-dm-bold text-enaleia-black">
              Saved Locations
            </Text>
            <Text className="text-sm font-dm-regular text-gray-600">
              Select a frequently used location
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : savedLocations.length === 0 ? (
          <View className="py-8 items-center">
            <View className="bg-gray-50 rounded-full p-4 mb-4">
              <Ionicons name="bookmark-outline" size={32} color="#6B7280" />
            </View>
            <Text className="text-base font-dm-regular text-gray-600 text-center">
              No saved locations yet.{"\n"}
              Locations will appear here when you save them.
            </Text>
          </View>
        ) : (
          <ScrollView className="max-h-96">
            {savedLocations.map((location) => {
              const isSelected = location.id === currentLocationId;
              return (
                <Pressable
                  key={location.id}
                  onPress={() => handleSelect(location)}
                  className={`flex-row items-center p-4 mb-2 border rounded-lg ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 active:bg-gray-50"
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center space-x-2">
                      <Text
                        className={`text-base font-dm-medium mb-1 ${
                          isSelected ? "text-blue-700" : "text-enaleia-black"
                        }`}
                      >
                        {location.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#3B82F6"
                        />
                      )}
                    </View>
                    <Text className="text-sm font-dm-regular text-gray-600">
                      Used {location.usageCount} time
                      {location.usageCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isSelected ? "#3B82F6" : "#6B7280"}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View className="pt-4 border-t border-gray-100">
          <Text className="text-xs font-dm-regular text-gray-500 text-center">
            Locations are sorted by frequency of use
          </Text>
        </View>
      </View>
    </ModalBase>
  );
}
