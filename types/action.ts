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

export type GroupedActions = Record<string, Action[]>;
export const processActions = (actions: any[]): GroupedActions => {
  const groupedActions: GroupedActions = {};

  const len = actions.length;

  for (let i = 0; i < len; i++) {
    const action = actions[i];
    const category = action.action_group;

    if (!groupedActions[category]) {
      groupedActions[category] = [];
    }

    const actionName = action.action_name;

    groupedActions[category].push({
      id: action.action_id,
      name: actionName,
      description: action.action_description,
      color: ACTION_COLORS[actionName as keyof typeof ACTION_COLORS],
      icon: ACTION_ICONS[actionName as keyof typeof ACTION_ICONS],
    });
  }

  return groupedActions;
};
