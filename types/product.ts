import { JsonValue } from "@/types/json";

export interface Product {
  id: number;
  name: string;
  type: string;
}

export const processProducts = (products: any[]): Product[] => {
  return products.map((product: any) => ({
    id: product.product_id,
    name: product.product_name,
    type: product.product_type,
  }));
};

export interface DirectusProduct {
  product_id: number;
  status: "published" | "draft" | "archived";
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  product_name?: string;
  product_type?: "Kayak" | "Fisher box";
  manufactured_by?: number; // Foreign key to Companies
  product_description?: string;
  percentage_of_ocean_waste?: number;
  product_images?: JsonValue; // Using JsonValue for json fields
}
