import { createDirectus, readItems, rest } from "@directus/sdk";

interface Material {
  id: number;
  name: string;
  // TODO: Add other fields from Directus schema
}

interface Action {
  name: string;
  slug: string;
  color: string;
  icon: string;
  category: string;
  // TODO: Add other fields from Directus schema
}

const directus = createDirectus(process.env.EXPO_PUBLIC_API_URL!).with(rest());

export async function fetchMaterials() {
  return directus.request(readItems("materials"));
}

export async function fetchActions() {
  const result = await directus.request(readItems("actions"));
  console.log({ result });
  return result;
}
