import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";
import { Action, processActions, groupActionsByCategory } from "@/types/action";

export function useActions() {
  const { data: batchData } = useQuery<BatchData | null>({
    queryKey: ["batchData"],
  });

  const actions = batchData?.actions as Action[] | undefined;

  return {
    actionsData: actions || [],
    groupedActions: actions ? groupActionsByCategory(actions) : {},
    hasActions: Boolean(actions?.length),
  };
}
