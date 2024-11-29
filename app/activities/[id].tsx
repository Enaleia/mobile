import SafeAreaContent from "@/components/SafeAreaContent";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text } from "react-native";

const ActivityDetails = () => {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaContent>
      <Text>Details of activity {id} </Text>
    </SafeAreaContent>
  );
};

export default ActivityDetails;
