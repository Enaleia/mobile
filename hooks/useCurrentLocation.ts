import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationService, LocationData } from "@/services/locationService";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

interface LocationState {
  data: LocationData | null;
  permissionStatus: Location.PermissionStatus | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCurrentLocation(options?: { enableHighAccuracy?: boolean }) {
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  const checkPermission = useCallback(async () => {
    const status = await locationService.getPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const locationQuery = useQuery({
    queryKey: ["currentLocation"],
    queryFn: async () => {
      const status = await checkPermission();

      if (status !== "granted") {
        throw new Error("Location permission not granted");
      }

      return locationService.getCurrentLocation({
        accuracy: options?.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const requestPermission = useCallback(async () => {
    const { status, isNew } = await locationService.requestPermission();
    setPermissionStatus(status);

    if (status === "granted") {
      queryClient.invalidateQueries({ queryKey: ["currentLocation"] });
    }

    return { status, isNew };
  }, [queryClient]);

  return {
    ...locationQuery,
    permissionStatus,
    requestPermission,
  };
}
