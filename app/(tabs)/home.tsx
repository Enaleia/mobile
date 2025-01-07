import ActionSelection from "@/components/features/home/ActionSelect";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { UserInfo } from "@/types/user";
import { directus } from "@/utils/directus";
import { readMe } from "@directus/sdk";
import { Ionicons } from "@expo/vector-icons";
import { Trans } from "@lingui/react";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { useActions } from "@/hooks/useActions";

function Home() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      try {
        const cachedData = queryClient.getQueryData<UserInfo>(["user-info"]);
        if (cachedData) return cachedData;

        const token = await directus.getToken();
        if (!token) throw new Error("No token found");

        const userData = await directus.request(readMe());
        if (!userData) throw new Error("No user data found");

        const freshData = {
          token,
          email: userData.email,
          name: userData.first_name,
          lastName: userData.last_name,
          avatar: userData.avatar,
          id: userData.id,
        };

        return freshData;
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
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

  const { isLoading: actionsLoading, actionsData } = useActions();

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
        <ActionSelection actions={actionsData} isLoading={actionsLoading} />
      </View>
    </SafeAreaContent>
  );
}

export default Home;
