import { ACTION_COLORS } from "@/constants/action";
import { ImageSourcePropType } from "react-native";

export interface Action {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: ImageSourcePropType;
}

// TODO: Re-assess if this is needed
export type ActionStatus = "Pending" | "In Progress" | "Complete";

export type ActionTitle =
  | "Fishing for litter"
  | "Manufacturing"
  | "Prevention"
  | "Shredding"
  | "Sorting"
  | "Washing"
  | "Batch"
  | "Beach cleanup"
  | "Ad-hoc"
  | "Pelletizing";

export type ActionCategory =
  | "Collecting"
  | "Transporting"
  | "Recycling"
  | "Manufacturing";

export type ActionIcon = Record<ActionTitle, ImageSourcePropType>;
export type ActionColor = Record<ActionTitle, string>;
export type ActionCategories = Record<ActionCategory, ActionTitle[]>;
export type ActionSlug = Record<ActionTitle, string>;
export type ActionIds = {
  [K in keyof typeof ACTION_COLORS]: number;
};
