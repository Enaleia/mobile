import { DirectusAction } from "@/types/action";
import { DirectusCollector } from "@/types/collector";
import {
  MaterialTrackingEvent,
  MaterialTrackingEventInput,
  MaterialTrackingEventOutput,
} from "@/types/event";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { Company } from "./company";
import { EnaleiaUser } from "./user";

export interface EnaleiaDirectusSchema {
  Events: MaterialTrackingEvent[];
  Events_Input: MaterialTrackingEventInput[];
  Events_Output: MaterialTrackingEventOutput[];
  Materials: DirectusMaterial[];
  Collectors: DirectusCollector[];
  Products: DirectusProduct[];
  Actions: DirectusAction[];
  Companies: Company[];
  directus_users: EnaleiaUser[];
}

export interface EnaleiaEASSchema {
  userID: string;
  portOrCompanyName: string;
  portOrCompanyCoordinates: string[];
  actionType: string;
  actionDate: string;
  actionCoordinates: string[];
  collectorName: string;
  incomingMaterials: string[];
  incomingWeightsKg: number[];
  incomingCodes: string[];
  outgoingMaterials: string[];
  outgoingWeightsKg: number[];
  outgoingCodes: string[];
  productName: string;
  batchQuantity: number;
  weightPerItemKg: string;
}
