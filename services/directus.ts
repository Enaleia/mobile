import { directus } from "@/utils/directus";
import { readItems } from "@directus/sdk";

function formatDirectusError(endpoint: string, error: any): Error {
  const errorMessage =
    error.errors?.[0]?.message || error.message || "Unknown error";
  const errorCode = error.errors?.[0]?.extensions?.code || "UNKNOWN_ERROR";
  return new Error(
    `Failed to fetch ${endpoint}: ${errorMessage} (${errorCode})`
  );
}

export async function fetchMaterials() {
  try {
    return await directus.request(readItems("Materials"));
  } catch (error: any) {
    throw formatDirectusError("Materials", error);
  }
}

export async function fetchActions() {
  try {
    const token = await directus.getToken();
    return await directus.request(readItems("Actions"));
  } catch (error: any) {
    throw formatDirectusError("Actions", error);
  }
}

export async function fetchCollectors() {
  try {
    return await directus.request(readItems("Collectors"));
  } catch (error: any) {
    throw formatDirectusError("Collectors", error);
  }
}

export async function fetchProducts() {
  try {
    return await directus.request(readItems("Products"));
  } catch (error: any) {
    throw formatDirectusError("Products", error);
  }
}
