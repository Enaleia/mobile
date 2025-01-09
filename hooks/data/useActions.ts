import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";

export function useActions() {
  const {
    data: batchData,
    isLoading,
    error,
  } = useQuery<BatchData>({
    queryKey: ["batchData"],
  });

  return {
    isLoading,
    error,
    hasActions: Boolean(batchData?.actions),
    actionsData: batchData?.actions,
  };
}
