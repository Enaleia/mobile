import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";

const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access location was denied");
  }

  return await Location.getCurrentPositionAsync({});
};

export const useCurrentLocation = () => {
  return useQuery({
    queryKey: ["currentLocation"],
    queryFn: getCurrentLocation,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
};
