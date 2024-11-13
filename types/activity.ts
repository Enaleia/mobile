// Base types for resources
export type ResourceType = "container" | "material"; // maybe pellets here too
export type MaterialType = "plastic" | "other"; // yeah theres more
export type ResourceRole = "input" | "output";
export const ActivityType = [
  "litter_fishing",
  "sorting",
  "beach_cleaning",
] as const;

export type ActivityType = (typeof ActivityType)[number];

// Form data interfaces
export interface EventFormData {
  type: ActivityType;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  notes?: string;
  inputs: ResourceInput[];
  outputs: ResourceOutput[];
}

export interface BaseResource {
  type: ResourceType;
  code: string;
  weightKg: number;
}

export interface MaterialResource extends BaseResource {
  type: "material";
  materialType: MaterialType;
}

export interface ContainerResource extends BaseResource {
  type: "container";
}

export interface CollectorInput {
  type: "collector";
  id: string;
  name?: string;
}

export type ResourceInput = (
  | MaterialResource
  | ContainerResource
  | CollectorInput
) & {
  role: "input";
};

export type ResourceOutput = (MaterialResource | ContainerResource) & {
  role: "output";
};
