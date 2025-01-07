import { useQueries } from "@tanstack/react-query";
import { fetchMaterials, fetchActions } from "@/services/directus";
import { updateMaterialConstants } from "@/constants/material";
import { updateActionConstants } from "@/constants/action";

export function useDirectusData() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["materials"],
        queryFn: fetchMaterials,
        staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
      {
        queryKey: ["actions"],
        queryFn: fetchActions,
        staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    ],
  });

  const [materialsQuery, actionsQuery] = results;

  // Update constants when data is available
  if (materialsQuery.data) {
    updateMaterialConstants(materialsQuery.data);
  }

  if (actionsQuery.data) {
    updateActionConstants(actionsQuery.data);
  }

  return {
    isLoading: materialsQuery.isLoading || actionsQuery.isLoading,
    error: materialsQuery.error || actionsQuery.error,
    hasData: Boolean(materialsQuery.data && actionsQuery.data),
  };
}
