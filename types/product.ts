import { JsonValue } from "@/types/json";
import { DirectusItemStatus } from "./directus";

export const processProducts = (
  products: DirectusProduct[]
): Pick<DirectusProduct, "product_id" | "product_name" | "product_type" | "manufactured_by">[] => {
  return products.map(({ product_id, product_name, product_type, manufactured_by }) => ({
    product_id,
    product_name,
    product_type,
    manufactured_by,
  }));
};

export interface DirectusProduct {
  product_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  product_name?: string;
  product_type?: "Kayak" | "Fisher box";
  manufactured_by?: {
    id: number;
    name: string;
  }; // Company information
  product_description?: string;
  percentage_of_ocean_waste?: number;
  product_images?: JsonValue; // Using JsonValue for json fields
}
