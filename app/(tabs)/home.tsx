import { useMaterialsAndActionsByRoles } from "@/api/user/materials_actions";
import SafeAreaContent from "@/components/SafeAreaContent";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";

export default function Home() {
  const [roles, setRoles] = useState<string[]>([]);

  const {
    data: rolesData,
    isLoading: isLoadingRolesData,
    error: rolesError,
  } = useMaterialsAndActionsByRoles(roles);

  useEffect(() => {
    const mockRoleFetch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setRoles(["Internal", "Administrator", "Recycler"]);
    };
    mockRoleFetch();
  }, []);

  if (isLoadingRolesData) {
    return (
      <SafeAreaContent>
        <View className="flex-1 items-center justify-center bg-neutral-50 rounded-lg border-[1.5px] border-neutral-200">
          <Text>Loading</Text>
        </View>
      </SafeAreaContent>
    );
  }

  if (rolesError) {
    return (
      <SafeAreaContent>
        <Text>Error: {rolesError.message}</Text>
      </SafeAreaContent>
    );
  }

  if (rolesData && !isLoadingRolesData && !rolesError) {
    console.log({ roles, rolesData });
  }

  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2">
        <Text className="text-sm font-semibold text-neutral-600 uppercase">
          Enaleia
        </Text>
        <View className="flex-row items-center justify-center gap-1 bg-green-50 rounded-full pb-1 px-2 border border-green-500">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs font-semibold text-neutral-600">Online</Text>
        </View>
      </View>
      <MotiView
        entering={FadeIn}
        exiting={FadeOut}
        className="flex-1 items-center justify-center bg-neutral-50 rounded-lg border-[1.5px] border-neutral-200"
      >
        <Text>Active attestations</Text>
      </MotiView>
      <View className="flex-row items-center justify-center w-full p-0 m-0">
        <TouchableOpacity className="w-full bg-blue-600 rounded-md flex flex-row items-center justify-center gap-2 py-3 mt-2">
          <Text className="text-white font-semibold h-full flex items-center justify-center">
            Add new attestation
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="dark" />
    </SafeAreaContent>
  );
}
