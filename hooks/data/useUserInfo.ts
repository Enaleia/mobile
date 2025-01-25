import { useQuery, useQueryClient } from "@tanstack/react-query";
import { directus } from "@/utils/directus";
import { readMe } from "@directus/sdk";
import { UserInfo } from "@/types/user";

export function useUserInfo() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      try {
        const cachedData = queryClient.getQueryData<UserInfo>(["user-info"]);
        if (cachedData) {
          console.log("User info fetched from cache");
          return cachedData;
        }

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
          company: userData.company,
        };

        queryClient.setQueryData(["user-info"], freshData);
        console.log("User info fetched");
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
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  return {
    isLoading,
    error,
    hasUser: Boolean(data?.token),
    userData: data,
  };
}
