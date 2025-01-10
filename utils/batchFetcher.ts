import {
  fetchActions,
  fetchMaterials,
  fetchCollectors,
  fetchProducts,
} from "@/services/directus";

export async function batchFetchData() {
  const results = await Promise.allSettled([
    fetchActions().catch((error) => {
      console.error("Actions fetch error:", error);
      throw error;
    }),
    fetchMaterials().catch((error) => {
      console.error("Materials fetch error:", error);
      throw error;
    }),
    fetchCollectors().catch((error) => {
      console.error("Collectors fetch error:", error);
      throw error;
    }),
    fetchProducts().catch((error) => {
      console.error("Products fetch error:", error);
      throw error;
    }),
  ]);

  const errors = results
    .map((result, index) => {
      if (result.status === "rejected") {
        const endpoints = ["actions", "materials", "collectors", "products"];
        return `${endpoints[index]}: ${result.reason.message}`;
      }
      return null;
    })
    .filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Batch fetch failed:\n${errors.join("\n")}`);
  }

  const [actions, materials, collectors, products] = results.map((result) =>
    result.status === "fulfilled" ? result.value : null
  );

  if (!actions || !materials || !collectors || !products) {
    throw new Error(
      "Missing required data: " +
        [
          !actions && "actions",
          !materials && "materials",
          !collectors && "collectors",
          !products && "products",
        ]
          .filter(Boolean)
          .join(", ")
    );
  }

  return {
    actions,
    materials,
    collectors,
    products,
  };
}
