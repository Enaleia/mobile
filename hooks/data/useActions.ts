import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";
import { Action, processActions, groupActionsByCategory } from "@/types/action";

export function useActions() {
  // This will read from the existing cache populated by index.tsx
  const { data: batchData } = useQuery<BatchData | null>({
    queryKey: ["batchData"],
  });

  // The actions are already processed in index.tsx, so we can use them directly
  const actions = batchData?.actions as Action[] | undefined;

  return {
    actionsData: actions || [],
    groupedActions: actions ? groupActionsByCategory(actions) : {},
    hasActions: Boolean(actions?.length),
  };
}
