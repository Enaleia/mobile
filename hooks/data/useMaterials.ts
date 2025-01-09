import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";

export function useMaterials() {
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
    hasMaterials: Boolean(batchData?.materials),
    materialsData: batchData?.materials,
  };
}
