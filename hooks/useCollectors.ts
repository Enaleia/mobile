import { useQuery, useQueryClient } from "@tanstack/react-query";
import { directus } from "@/utils/directus";
import { readItems } from "@directus/sdk";

export interface Collector {
  id: number;
  code: string;
  name: string;
}

function processCollectors(collectors: any[]): Collector[] {
  return collectors.map((collector: any) => ({
    id: collector.collector_id,
    name: collector.collector_name,
    code: collector.collector_identity,
  }));
}

export function useCollectors() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      try {
        const collectors = await directus.request(readItems("Collectors"));
        const processedCollectors = processCollectors(collectors);
        queryClient.setQueryData(["collectors"], processedCollectors);
        console.log("Collectors fetched");
        return processedCollectors;
      } catch (error) {
        const cachedData = queryClient.getQueryData<Collector[]>([
          "collectors",
        ]);
        if (cachedData) {
          console.log("Collectors fetched from cache");
          return cachedData;
        }
        console.log("Collectors fetch error:", error);
        throw error;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  return {
    isLoading,
    error,
    hasCollectors: Boolean(data),
    collectorsData: data,
  };
}
