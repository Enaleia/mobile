import { useQuery, useQueryClient } from "@tanstack/react-query";
import { directus } from "@/utils/directus";
import { readItems } from "@directus/sdk";

export interface Product {
  id: number;
  name: string;
  type: string;
}

function processProducts(products: any[]): Product[] {
  return products.map((product: any) => ({
    id: product.product_id,
    name: product.product_name,
    type: product.product_type,
  }));
}

export function useProducts() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const products = await directus.request(readItems("Products"));
        const processedProducts = processProducts(products);
        queryClient.setQueryData(["products"], processedProducts);
        console.log("Products fetched");
        return processedProducts;
      } catch (error) {
        const cachedData = queryClient.getQueryData<Product[]>(["products"]);
        if (cachedData) {
          console.log("Products fetched from cache");
          return cachedData;
        }
        console.log("Products fetch error:", error);
        throw error;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  return {
    isLoading,
    error,
    hasProducts: Boolean(data),
    productsData: data,
  };
}
