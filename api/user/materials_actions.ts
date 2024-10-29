import { useQuery } from "@tanstack/react-query";

const getMaterialsAndActionsByRoles = async (roles: string[]) => {
  const rolesParam = roles.join(",");

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_DEV_API_URL}/v1/get_actions_and_materials_for_role?roles=${rolesParam}`
    );

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Missing roles parameter");
      }
      throw new Error("Error fetching materials and actions data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const useMaterialsAndActionsByRoles = (roles: string[]) => {
  return useQuery({
    queryKey: ["auth", "roles", "materialsAndActions", ...roles],
    queryFn: () => getMaterialsAndActionsByRoles(roles),
    enabled: roles.length > 0,
    placeholderData: {
      data: null,
      isLoading: false,
      refetch: () => {},
    },
  });
};
