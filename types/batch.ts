import { GroupedActions } from "@/types/action";
import { MaterialsData } from "@/types/material";
import { Collector } from "@/types/collector";
import { Product } from "@/types/product";

export interface BatchData {
  actions: GroupedActions;
  materials: MaterialsData;
  collectors: Collector[];
  products: Product[];
}
