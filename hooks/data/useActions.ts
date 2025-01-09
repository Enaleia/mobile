import { ACTION_COLORS, ACTION_ICONS } from "@/constants/action";
import { fetchActions } from "@/services/directus";
import { Action } from "@/types/action";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type GroupedActions = Record<string, Action[]>;

export const processActions = (actions: any[]): GroupedActions => {
  return actions.reduce((acc: GroupedActions, action: any) => {
    const category = action.action_group;
    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push({
      id: action.action_id,
      name: action.action_name,
      description: action.action_description,
      color: ACTION_COLORS[action.action_name as keyof typeof ACTION_COLORS],
      icon: ACTION_ICONS[action.action_name as keyof typeof ACTION_ICONS],
    });

    return acc;
  }, {});
};

export function useActions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["actions"],
    queryFn: async () => {
      try {
        const actions = await fetchActions();
        const processedActions = processActions(actions);

        queryClient.setQueryData(["actions"], processedActions);
        console.log("Actions fetched");
        return processedActions;
      } catch (error) {
        const cachedData = queryClient.getQueryData<GroupedActions>([
          "actions",
        ]);
        if (cachedData) {
          console.log("Actions fetched from cache");
          return cachedData;
        }
        console.log("Actions fetched from cache", error);
        throw error;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  // console.log({ actionData: JSON.stringify(data, null, 2) });

  return {
    isLoading,
    error,
    hasActions: Boolean(data),
    actionsData: data,
  };
}
