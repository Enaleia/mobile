import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";

export function useCollectors() {
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
    hasCollectors: Boolean(batchData?.collectors),
    collectorsData: batchData?.collectors,
  };
}
