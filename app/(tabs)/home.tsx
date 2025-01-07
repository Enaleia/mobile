import ActionSelection from "@/components/features/home/ActionSelect";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { NoDataScreen } from "@/components/NoDataScreen";
import { UserInfo } from "@/types/user";
import { directus } from "@/utils/directus";
import { readMe } from "@directus/sdk";
import { Ionicons } from "@expo/vector-icons";
import { Trans } from "@lingui/react";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { useDirectusData } from "@/hooks/useDirectusData";

function Home() {
  const queryClient = useQueryClient();

  const {
    isLoading: directusLoading,
    error: directusError,
    hasData,
  } = useDirectusData();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      // First try to get cached data
      const cachedData = queryClient.getQueryData<UserInfo>(["user-info"]);
      if (cachedData) return cachedData;

      // If no cached data, fetch fresh data
      const token = await directus.getToken();
      if (!token) throw new Error("No token found");

      const userData = await directus.request(readMe());
      const freshData = {
        token,
        email: userData.email,
        name: userData.first_name,
        lastName: userData.last_name,
        avatar: userData.avatar,
        id: userData.id,
      };

      return freshData;
    },
    initialData: {
      token: "",
      email: "",
      name: "",
      lastName: "",
      avatar: "",
      id: "",
    },
  });

  if (directusLoading || userLoading) {
    return <LoadingScreen />;
  }

  if (directusError) {
    return <ErrorScreen message={directusError.message} />;
  }

  if (!hasData) {
    return (
      <NoDataScreen message="Please connect to the internet to load required data" />
    );
  }

  return (
    <SafeAreaContent>
      <View className="flex-row items-start justify-between pb-2 font-dm-regular">
        <View className="flex-row items-center justify-center gap-0.5">
          <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
          <Text className="text-sm font-bold text-enaleia-black">
            {user.name}
          </Text>
        </View>
        <View className="flex-row items-center justify-center px-1.5 py-0.5 space-x-1 bg-sand-beige rounded-full">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs font-dm-medium text-enaleia-black">
            {onlineManager.isOnline() ? "Online" : "Offline"}
          </Text>
        </View>
      </View>
      <View className="flex-1 mt-4">
        <Text className="text-3xl font-dm-bold tracking-[-1.5px] mb-2 text-enaleia-black">
          <Trans id="home.welcome_message">
            Hello, what action will you be doing today?
          </Trans>
        </Text>
        <ActionSelection />
      </View>
    </SafeAreaContent>
  );
}

export default Home;
