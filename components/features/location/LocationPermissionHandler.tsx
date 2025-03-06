import { useEffect } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_INTRO_KEY = "@location_intro_seen";

interface LocationPermissionHandlerProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function LocationPermissionHandler({
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionHandlerProps) {
  const {
    permissionStatus,
    requestPermission,
  } = useCurrentLocation();

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    const hasSeenIntro = await AsyncStorage.getItem(LOCATION_INTRO_KEY);
    if (!hasSeenIntro && permissionStatus !== "granted") {
      const { status } = await requestPermission();
      if (status === "granted") {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    }
  };

  return null; // This component doesn't render anything
} 