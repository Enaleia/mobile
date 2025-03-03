import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";
import { Action, processActions, groupActionsByCategory } from "@/types/action";

export function useActions() {
  const {
    data: batchData,
    isLoading,
    error,
  } = useQuery<BatchData | null, Error, BatchData | null>({
    queryKey: ["batchData"],
    select: (data) => {
      if (!data) return null;
      return {
        ...data,
        actions: data.actions || [],
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const actions = batchData?.actions || [];

  return {
    actionsData: actions,
    groupedActions: actions.length > 0 ? groupActionsByCategory(actions) : {},
    hasActions: actions.length > 0,
    isLoading,
    error,
  };
}
