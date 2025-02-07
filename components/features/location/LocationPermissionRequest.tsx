import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationEducationalModal } from "./LocationEducationalModal";
import { SavedLocationsSelector } from "./SavedLocationsSelector";
import { SaveLocationModal } from "./SaveLocationModal";
import { locationService, LocationData } from "@/services/locationService";

const LOCATION_INTRO_KEY = "@location_intro_seen";

interface LocationPermissionRequestProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onLocationSelected?: (location: LocationData) => void;
  currentLocation?: LocationData;
}

export function LocationPermissionRequest({
  onPermissionGranted,
  onPermissionDenied,
  onLocationSelected,
  currentLocation,
}: LocationPermissionRequestProps) {
  const {
    permissionStatus,
    requestPermission,
    data: currentLocationData,
  } = useCurrentLocation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    const hasSeenIntro = await AsyncStorage.getItem(LOCATION_INTRO_KEY);
    if (!hasSeenIntro && permissionStatus !== "granted") {
      setShowEducationalModal(true);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const { status, isNew } = await requestPermission();

      if (status === "granted") {
        onPermissionGranted?.();
      } else if (isNew && status === "denied") {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSaveCurrentLocation = async () => {
    if (!currentLocationData) return;

    setIsSaving(true);
    try {
      // Check for nearby locations first
      const savedLocations = await locationService.getSavedLocations();
      const nearbyLocation = savedLocations.find((saved) => {
        const distance = locationService.calculateDistance(
          saved.coords,
          currentLocationData.coords
        );
        return distance < 0.1; // Within 100 meters
      });

      if (nearbyLocation) {
        Alert.alert(
          "Location Already Saved",
          `You already have a saved location "${nearbyLocation.name}" near this point. Would you like to update it instead?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsSaving(false),
            },
            {
              text: "Update",
              onPress: () => {
                setShowSaveLocationModal(true);
              },
            },
          ]
        );
      } else {
        setShowSaveLocationModal(true);
      }
    } catch (error) {
      console.error("Error checking for nearby locations:", error);
      Alert.alert("Error", "Failed to check for nearby locations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async (name: string) => {
    if (!currentLocationData || !name) return;

    setIsSaving(true);
    try {
      const saved = await locationService.saveLocation(
        name,
        currentLocationData
      );
      console.log("Location saved:", saved);
      Alert.alert("Success", "Location saved successfully");
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  if (permissionStatus === "granted") {
    return (
      <View className="bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="location" size={20} color="#10B981" />
            <Text className="text-sm font-dm-medium text-gray-700">
              Location Enabled
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => setShowSavedLocations(true)}
              className="bg-gray-50 p-2 rounded-full"
            >
              <Ionicons name="bookmark-outline" size={20} color="#4B5563" />
            </Pressable>
            <Pressable
              onPress={handleSaveCurrentLocation}
              disabled={isSaving}
              className="bg-gray-50 p-2 rounded-full"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Ionicons name="add" size={20} color="#4B5563" />
              )}
            </Pressable>
          </View>
        </View>

        <LocationEducationalModal
          isVisible={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
          onRequestLocation={handleRequestPermission}
          onSkip={() => setShowEducationalModal(false)}
        />

        <SavedLocationsSelector
          isVisible={showSavedLocations}
          onClose={() => setShowSavedLocations(false)}
          onSelect={(location) => {
            onLocationSelected?.(location);
            setShowSavedLocations(false);
          }}
          currentLocationId={currentLocation?.savedLocationId}
        />
      </View>
    );
  }

  return (
    <>
      <View className="bg-white rounded-lg p-4 shadow-sm space-y-4">
        <View className="flex-row items-center space-x-3">
          <View className="bg-blue-50 rounded-full p-2">
            <Ionicons name="location-outline" size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-dm-bold text-enaleia-black tracking-tight">
              Add Location to Event
            </Text>
            <Text className="text-sm font-dm-regular text-gray-600">
              Help verify where this event took place
            </Text>
          </View>
        </View>

        <View className="space-y-3">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Verify event location accuracy
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Works offline with location caching
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Battery efficient location updates
            </Text>
          </View>
        </View>

        <View className="flex-row space-x-2">
          <Pressable
            onPress={handleRequestPermission}
            disabled={isRequesting}
            className={`flex-1 flex-row items-center justify-center p-3 rounded-full ${
              isRequesting ? "bg-blue-400" : "bg-blue-ocean"
            }`}
          >
            {isRequesting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : (
              <Ionicons
                name="location"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            )}
            <Text className="text-base font-dm-medium text-white tracking-tight">
              {isRequesting ? "Requesting..." : "Enable Location"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowSavedLocations(true)}
            className="bg-gray-100 p-3 rounded-full aspect-square items-center justify-center"
          >
            <Ionicons name="bookmark-outline" size={20} color="#4B5563" />
          </Pressable>
        </View>
      </View>

      <LocationEducationalModal
        isVisible={showEducationalModal}
        onClose={() => setShowEducationalModal(false)}
        onRequestLocation={handleRequestPermission}
        onSkip={() => setShowEducationalModal(false)}
      />

      <SavedLocationsSelector
        isVisible={showSavedLocations}
        onClose={() => setShowSavedLocations(false)}
        onSelect={(location) => {
          onLocationSelected?.(location);
          setShowSavedLocations(false);
        }}
        currentLocationId={currentLocation?.savedLocationId}
      />

      <SaveLocationModal
        isVisible={showSaveLocationModal}
        onClose={() => setShowSaveLocationModal(false)}
        onSave={handleSaveLocation}
      />
    </>
  );
}
