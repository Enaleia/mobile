import {
  fetchActions,
  fetchMaterials,
  fetchCollectors,
  fetchProducts,
} from "@/services/directus";

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

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (
        result.status === "rejected" &&
        !result.reason.message?.includes("FORBIDDEN")
      ) {
        errors.push(`${endpoints[i]}: ${result.reason.message}`);
      }
    }

    if (errors.length > 0) {
      // If all errors are auth related, handle quietly
      if (errors.every((err) => err.includes("FORBIDDEN"))) {
        return createEmptyBatchData();
      }
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
    if (error.message?.includes("FORBIDDEN")) {
      return createEmptyBatchData();
    }
    throw error;
  }
}
