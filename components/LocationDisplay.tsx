import React from "react";
import { Text, View } from "react-native";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const LocationDisplay = () => {
  const { data: location, isLoading, error } = useCurrentLocation();

  if (isLoading) return <Text>Getting location...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Location data: {JSON.stringify(location)}</Text>
    </View>
  );
};

export default LocationDisplay;
