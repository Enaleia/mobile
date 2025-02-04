import { JsonValue } from "@/types/json";

export interface Collector {
  id: number;
  code: string;
  name: string;
}

export const processCollectors = (collectors: any[]): Collector[] => {
  return collectors.map((collector: any) => ({
    id: collector.collector_id,
    name: collector.collector_name,
    code: collector.collector_identity,
  }));
};

export interface DirectusCollector {
  collector_id: number;
  status: "published" | "draft" | "archived";
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  is_active?: boolean;
  contact_person?: string;
  fishing_season?: JsonValue; // json type
  country?: number; // Foreign key to countries
  collector_company_name?: string;
  vessel_type?: number; // Foreign key to Vessels_Type
  registered_port?: number; // Foreign key to Companies
  fishing_zone?: any; // geometry.Polygon type
  collector_identity?: string;
  collector_name?: string;
  start_date?: string;
  events?: any; // o2m relationship alias
}
