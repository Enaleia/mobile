import { ActionTitle } from "@/types/action";
import { directus } from "@/utils/directus";
import { readItems } from "@directus/sdk";

export interface DirectusAction {
  id: number;
  name: ActionTitle;
  slug: string;
  color: string;
  icon: string;
  category: string;
}

export interface DirectusMaterial {
  id: number;
  name: string;
}

export async function fetchMaterials() {
  try {
    const materials = await directus.request(readItems("Materials"));
    return materials;
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw error;
  }
}

export async function fetchActions() {
  try {
    const actions = await directus.request(readItems("Actions"));
    return actions;
  } catch (error) {
    console.error("Error fetching actions:", error);
    throw error;
  }
}
