import { DirectusItemStatus } from "./directus";
import { MaterialTrackingEvent } from "./event";
import { EnaleiaUser } from "./user";

export interface Company {
  id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: "datetime";
  user_updated?: string; // UUID
  date_updated?: "datetime";
  name?: string;
  city?: string;
  country?: number;
  coordinates?: string;
  role?: string; // UUID
  contact_person?: string;
  is_active?: boolean;
  users?: EnaleiaUser[];
  events?: MaterialTrackingEvent[];
}
