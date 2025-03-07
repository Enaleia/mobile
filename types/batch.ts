import { Action } from "@/types/action";
import { MaterialsData } from "@/types/material";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";

export interface BatchData {
  actions: Action[];
  materials: MaterialsData;
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity"
  >[];
  products: Pick<
    DirectusProduct,
    "product_id" | "product_name" | "product_type"
  >[];
}
