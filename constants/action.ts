import {
  ActionCategories,
  ActionColor,
  ActionIcon,
  ActionSlug,
} from "@/types/action";

// Static assets and configurations that don't change
export const ACTION_COLORS: ActionColor = {
  "Ad-hoc": "#FABAA4",
  "Collection Batch": "#9FD08B",
  "Beach Cleanup": "#E2CD96",
  "Fishing for Litter": "#69B5E8",
  Manufacturing: "#E2B9ED",
  Pelletizing: "#DCB093",
  Prevention: "#7BCFCC",
  Shredding: "#EAD9B4",
  Sorting: "#82CC97",
  Washing: "#A7C8DE",
} as const;

export const ACTION_SLUGS: ActionSlug = {
  "Ad-hoc": "adhoc",
  "Collection Batch": "collection-batch",
  "Beach Cleanup": "beach-cleanup",
  "Fishing for Litter": "fishing-for-litter",
  Manufacturing: "manufacturing",
  Pelletizing: "pelletizing",
  Prevention: "prevention",
  Shredding: "shredding",
  Sorting: "sorting",
  Washing: "washing",
} as const;

const actionIcons = {
  "Ad-hoc": require("@assets/images/action-icons/Ad-hoc.webp"),
  "Collection Batch": require("@assets/images/action-icons/Batch.webp"),
  "Beach Cleanup": require("@assets/images/action-icons/Beach Cleanup.webp"),
  "Fishing for Litter": require("@assets/images/action-icons/Fishing for Litter.webp"),
  Manufacturing: require("@assets/images/action-icons/Manufacturing.webp"),
  Pelletizing: require("@assets/images/action-icons/Pelletizing.webp"),
  Prevention: require("@assets/images/action-icons/Prevention.webp"),
  Shredding: require("@assets/images/action-icons/Shredding.webp"),
  Sorting: require("@assets/images/action-icons/Sorting.webp"),
  Washing: require("@assets/images/action-icons/Washing.webp"),
} as const;

export const ACTION_ICONS: ActionIcon = actionIcons;

export const ACTION_CATEGORIES: ActionCategories = {
  Collecting: ["Fishing for Litter", "Prevention", "Ad-hoc", "Beach Cleanup"],
  Transporting: ["Collection Batch"],
  Recycling: ["Pelletizing", "Shredding", "Sorting", "Washing"],
  Manufacturing: ["Manufacturing"],
} as const;

// This will be populated from the database
export let ACTION_IDS: Record<string, number> | undefined = undefined;

export function updateActionConstants(actions: any[]) {
  ACTION_IDS = actions.reduce(
    (acc, action) => ({
      ...acc,
      [action.name]: action.id,
    }),
    {}
  );
}

export default actionIcons;
