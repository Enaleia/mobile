import { JsonValue } from "@/types/json";
import { DirectusItemStatus } from "./directus";

export interface MaterialTrackingEvent {
  event_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  event_timestamp?: string;
  event_location?: string;
  EAS_UID?: string;
  action?: number;
  internal_tag?: JsonValue;
  weight_slip_ref?: number;
  collector_name?: number;
  company?: number;
  Verified?: boolean;
  Ready_for_EAS_submission?: boolean;
  event_output_id?: MaterialTrackingEventOutput[];
  production_id?: number[];
  event_input_id?: MaterialTrackingEventInput[];
}

export interface MaterialTrackingEventInput {
  event_input_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  input_code?: string;
  input_weight?: number;
  event_id?: number;
  input_Material?: number;
}

export interface MaterialTrackingEventOutput {
  event_output_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  output_code?: string;
  output_material?: number;
  output_weight?: number;
  event_id?: number;
}
