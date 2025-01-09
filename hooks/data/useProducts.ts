import { useQuery } from "@tanstack/react-query";
import { BatchData } from "@/types/batch";

export function useProducts() {
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
    hasProducts: Boolean(batchData?.products),
    productsData: batchData?.products,
  };
}
