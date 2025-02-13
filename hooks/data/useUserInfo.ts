import { useQuery, useQueryClient } from "@tanstack/react-query";
import { directus } from "@/utils/directus";
import { readItems, readMe, readUsers } from "@directus/sdk";
import { EnaleiaUser } from "@/types/user";

export function useUserInfo() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      try {
        const cachedData = queryClient.getQueryData<EnaleiaUser>(["user-info"]);
        if (cachedData) {
          console.log("User info fetched from cache");
          return cachedData;
        }

        const token = await directus.getToken();
        if (!token) throw new Error("No token found");

        // First get basic user info
        const basicUserData = await directus.request(readMe());
        if (!basicUserData) throw new Error("No user data found");

        // Then get detailed user info including company
        const detailedUserData = await directus.request(
          readUsers({
            fields: ["id", "first_name", "last_name", "email", "Company"],
            filter: {
              id: {
                _eq: basicUserData.id,
              },
            },
            limit: 1,
          })
        );

        if (!detailedUserData?.[0])
          throw new Error("Failed to fetch user details");

        const freshData: EnaleiaUser = {
          ...detailedUserData[0],
          token,
        };

        queryClient.setQueryData(["user-info"], freshData);
        console.log("User info fetched", freshData);
        return freshData;
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    },
    initialData: {
      id: "",
      first_name: null,
      last_name: null,
      email: null,
      token: null,
      company: undefined,
    } as EnaleiaUser,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  return {
    isLoading,
    error,
    hasUser: Boolean(data?.token),
    userData: data,
  };
}
