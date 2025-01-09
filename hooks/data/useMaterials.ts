import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMaterials } from "@/services/directus";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ProcessedMaterial {
  id: number;
  name: string;
  // Add other material properties as needed
}

export interface MaterialsData {
  nameToId: Record<string, number>;
  idToName: Record<number, string>;
  options: Array<{
    label: string;
    value: number;
  }>;
}

export const processMaterials = (materials: any[]): MaterialsData => {
  const nameToId = materials.reduce(
    (acc, material) => ({
      ...acc,
      [material.material_name]: material.material_id,
    }),
    {}
  );

  const idToName = Object.fromEntries(
    materials.map((material) => [material.material_id, material.material_name])
  );

  const options = materials.map((material) => ({
    label: material.material_name,
    value: material.material_id,
  }));

  return {
    nameToId,
    idToName,
    options,
  };
};

export function useMaterials() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      try {
        const materials = await fetchMaterials();
        const processedMaterials = processMaterials(materials);

        queryClient.setQueryData(["materials"], processedMaterials);
        console.log("Materials fetched");
        return processedMaterials;
      } catch (error) {
        const cachedData = queryClient.getQueryData<MaterialsData>([
          "materials",
        ]);
        if (cachedData) {
          console.log("Materials fetched from cache");
          return cachedData;
        }
        console.log("Materials fetch error:", error);
        throw error;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  // console.log({ materialData: JSON.stringify(data, null, 2) });

  return {
    isLoading,
    error,
    hasMaterials: Boolean(data),
    materialsData: data,
  };
}
