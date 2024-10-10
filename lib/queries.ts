import { useQuery } from "@tanstack/react-query";
import directus from "./directus";

const getTaskActions = async () => {
  return directus.query(`
    query {
        task_action {
					id
          Task_name
          Task_type
          task_role
        }
    }
`);
};

export const useTaskActionsQuery = () =>
  useQuery({
    queryKey: ["taskAction"],
    queryFn: getTaskActions,
  });
