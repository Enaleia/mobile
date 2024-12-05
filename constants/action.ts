import { ActivityIcon, ActivityColor, ActionCategories } from "@/types/action";

const actionIcons = {
  "Ad-hoc": require("@assets/images/action-icons/Ad-hoc.webp"),
  Batch: require("@assets/images/action-icons/Batch.webp"),
  "Beach Cleanup": require("@assets/images/action-icons/Beach Cleanup.webp"),
  "Fishing for litter": require("@assets/images/action-icons/Fishing for Litter.webp"),
  Manufacturing: require("@assets/images/action-icons/Manufacturing.webp"),
  Pelletizing: require("@assets/images/action-icons/Pelletizing.webp"),
  Prevention: require("@assets/images/action-icons/Prevention.webp"),
  Shredding: require("@assets/images/action-icons/Shredding.webp"),
  Sorting: require("@assets/images/action-icons/Sorting.webp"),
  Washing: require("@assets/images/action-icons/Washing.webp"),
} as const;

export const ACTION_COLORS: ActionColor = {
  "Ad-hoc": "#FABAA4",
  Batch: "#9FD08B",
  "Beach Cleanup": "#E2CD96",
  "Fishing for litter": "#69B5E8",
  Manufacturing: "#E2B9ED",
  Pelletizing: "#DCB093",
  Prevention: "#7BCFCC",
  Shredding: "#EAD9B4",
  Sorting: "#82CC97",
  Washing: "#A7C8DE",
} as const;

export const ACTION_ICONS: ActionIcon = actionIcons;

export const ACTION_CATEGORIES: ActionCategories = {
  Collection: ["Fishing for litter", "Beach Cleanup", "Ad-hoc", "Prevention"],
  Transport: ["Batch"],
  Recycling: ["Pelletizing", "Shredding", "Sorting", "Washing"],
  Manufacturing: ["Manufacturing"],
} as const;

export default actionIcons;
