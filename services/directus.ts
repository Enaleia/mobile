import { directus } from "@/utils/directus";
import { readItems } from "@directus/sdk";

export async function fetchMaterials() {
  return directus.request(readItems("Materials"));
}

export async function fetchActions() {
  return directus.request(readItems("Actions"));
}

export async function fetchCollectors() {
  return directus.request(readItems("Collectors"));
}

export async function fetchProducts() {
  return directus.request(readItems("Products"));
}
