import {
  fetchActions,
  fetchMaterials,
  fetchCollectors,
  fetchProducts,
} from "@/services/directus";

export async function batchFetchData() {
  try {
    const results = await Promise.allSettled([
      fetchActions(),
      fetchMaterials(),
      fetchCollectors(),
      fetchProducts(),
    ]);

    const errors = results
      .map((result, index) => {
        if (result.status === "rejected") {
          const endpoints = ["actions", "materials", "collectors", "products"];
          // Don't log auth errors as they're expected when signed out
          if (!result.reason.message?.includes("FORBIDDEN")) {
            console.error(`${endpoints[index]} fetch error:`, result.reason);
          }
          return `${endpoints[index]}: ${result.reason.message}`;
        }
        return null;
      })
      .filter(Boolean);

    if (errors.length > 0) {
      // If all errors are auth related, handle quietly
      if (errors.every((err) => err && err.includes("FORBIDDEN"))) {
        return {
          actions: [],
          materials: [],
          collectors: [],
          products: [],
        };
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
    // Return empty data for auth errors instead of throwing
    if (error.message?.includes("FORBIDDEN")) {
      return {
        actions: [],
        materials: [],
        collectors: [],
        products: [],
      };
    }
    throw error;
  }
}
