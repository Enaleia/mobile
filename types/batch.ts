import { Action } from "@/types/action";
import { MaterialsData } from "@/types/material";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";

export interface BatchData {
  actions: Action[];
  materials: MaterialsData;
  collectors: DirectusCollector[];
  products: DirectusProduct[];
}
