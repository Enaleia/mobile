import { Action, GroupedActions } from "@/types/action";
import { MaterialsData } from "@/types/material";
import { Collector } from "@/types/collector";
import { Product } from "@/types/product";

export interface BatchData {
  actions: Action[];
  materials: MaterialsData;
  collectors: Collector[];
  products: Product[];
}
