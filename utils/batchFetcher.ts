import {
  fetchActions,
  fetchMaterials,
  fetchCollectors,
  fetchProducts,
} from "@/services/directus";
import { router } from "expo-router";

const createEmptyBatchData = () => ({
  actions: [],
  materials: [],
  collectors: [],
  products: [],
});

export async function batchFetchData() {
  try {
    const results = await Promise.allSettled([
      fetchActions(),
      fetchMaterials(),
      fetchCollectors(),
      fetchProducts(),
    ]);

    const errors: string[] = [];
    const endpoints = ["actions", "materials", "collectors", "products"];

    let hasAuthError = false;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        const error = result.reason;
        const isAuthError =
          error.message?.includes("FORBIDDEN") ||
          error.message?.includes("TOKEN_EXPIRED") ||
          error.message?.includes("TOKEN_INVALID");

        if (isAuthError) {
          hasAuthError = true;
          break;
        }

        if (!isAuthError) {
          errors.push(`${endpoints[i]}: ${error.message}`);
        }
      }
    }

    if (hasAuthError) {
      router.replace("/login");
      return createEmptyBatchData();
    }

    if (errors.length > 0) {
      throw new Error(`Batch fetch failed:\n${errors.join("\n")}`);
    }

    const [actions, materials, collectors, products] = results.map((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    return {
      actions: actions || [],
      materials: materials || [],
      collectors: collectors || [],
      products: products || [],
    };
  } catch (error: any) {
    if (
      error.message?.includes("FORBIDDEN") ||
      error.message?.includes("TOKEN_EXPIRED") ||
      error.message?.includes("TOKEN_INVALID")
    ) {
      router.replace("/login");
      return createEmptyBatchData();
    }
    throw error;
  }
}
