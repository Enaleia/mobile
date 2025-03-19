import { Action } from "@/types/action";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";
import { DirectusMaterial } from "@/types/material";

export interface BatchData {
  actions: Action[];
  materials: DirectusMaterial[];
  materialOptions: { label: string; value: number }[];
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity"
  >[];
  products: Pick<
    DirectusProduct,
    "product_id" | "product_name" | "product_type" | "manufactured_by"
  >[];
  lastUpdated?: number;
}
