import { useEffect, useState } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationEducationalModal } from "./LocationEducationalModal";

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
  const [showEducationalModal, setShowEducationalModal] = useState(false);

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
    const { status } = await requestPermission();
    if (status === "granted") {
      onPermissionGranted?.();
    } else {
      onPermissionDenied?.();
    }
  };

  return (
    <LocationEducationalModal
      isVisible={showEducationalModal}
      onClose={() => setShowEducationalModal(false)}
      onRequestLocation={handleRequestPermission}
      onSkip={() => {
        setShowEducationalModal(false);
        onPermissionDenied?.();
      }}
    />
  );
} 