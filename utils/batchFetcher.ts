import {
  fetchActions,
  fetchMaterials,
  fetchCollectors,
  fetchProducts,
} from "@/services/directus";

export async function batchFetchData() {
  try {
    const [actions, materials, collectors, products] = await Promise.all([
      fetchActions(),
      fetchMaterials(),
      fetchCollectors(),
      fetchProducts(),
    ]);

    return {
      actions,
      materials,
      collectors,
      products,
    };
  } catch (error) {
    console.error("Batch fetch error:", error);
    throw error;
  }
}
