import { useState, useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';

const LOCATION_BUTTON_CLICKS = "@location_button_clicks";
const LOCATION_PERMANENTLY_DISABLED = "@location_permanently_disabled";

export const useLocationPermissionFlow = () => {
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(false);

  useEffect(() => {
    // Load initial states
    const loadState = async () => {
      const [clicks, disabled] = await Promise.all([
        AsyncStorage.getItem(LOCATION_BUTTON_CLICKS),
        AsyncStorage.getItem(LOCATION_PERMANENTLY_DISABLED),
      ]);
      
      setClickCount(parseInt(clicks || '0', 10));
      setIsPermanentlyDisabled(disabled === 'true');
    };
    
    loadState();
  }, []);

  const handleActionButtonClick = async () => {
    // Check if permanently disabled
    if (isPermanentlyDisabled) {
      return true; // Proceed with action without location
    }

    // Check current permission status
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status === 'granted') {
      return true; // Proceed with action
    }

    // Increment click counter if not permanently disabled
    const newClickCount = clickCount + 1;
    await AsyncStorage.setItem(LOCATION_BUTTON_CLICKS, newClickCount.toString());
    setClickCount(newClickCount);
    
    // Show educational modal
    setShowEducationalModal(true);
    return false; // Don't proceed with action yet
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  return {
    showEducationalModal,
    setShowEducationalModal,
    clickCount,
    handleActionButtonClick,
    requestLocationPermission,
  };
};
