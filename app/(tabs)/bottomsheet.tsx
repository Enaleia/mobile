import React, { useCallback } from "react";
import { View, Text } from "react-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCountries } from "@/api/country/get-countries";
import { View as MotiView } from "moti";

const BottomSheetScreen = () => {
  const { data, isLoading, error } = useCountries();

  // render
  const renderItem = useCallback(
    ({ item, index }: any) => (
      <MotiView
        from={{ opacity: 0, translateX: -10 }}
        animate={{ translateX: 0, opacity: 1 }}
        exit={{ opacity: 0, translateX: -10 }}
        transition={{ delay: index * 60 + 1000, type: "spring" }}
        className="mt-4 text-base"
      >
        <Text className="font-bold text-lg">{item.Country}</Text>
      </MotiView>
    ),
    []
  );

  return (
    <View className="flex-1 p-4 border-2 border-red-500">
      <Text className="text-3xl font-bold mb-2">Countries</Text>

      {isLoading && <Text>Loading countries...</Text>}
      {error && <Text>Error loading countries: {error.message}</Text>}

      {data && (
        <BottomSheetFlatList
          data={data.Country}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      )}
    </View>
  );
};

export default BottomSheetScreen;
