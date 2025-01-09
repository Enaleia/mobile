import { ACTION_COLORS, ACTION_ICONS } from "@/constants/action";
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

// Add the missing GroupedActions type
export type GroupedActions = Record<string, Action[]>;

export const processActions = (actions: any[]): GroupedActions => {
  return actions.reduce((acc: GroupedActions, action: any) => {
    const category = action.action_group;
    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push({
      id: action.action_id,
      name: action.action_name,
      description: action.action_description,
      color: ACTION_COLORS[action.action_name as keyof typeof ACTION_COLORS],
      icon: ACTION_ICONS[action.action_name as keyof typeof ACTION_ICONS],
    });

    return acc;
  }, {});
};
