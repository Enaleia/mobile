import { ActivityTitle } from "@/constants/ActivityAssets";

export interface UIActivity {
  date: string;
  status: ActivityStatus;
  location: string;
  title: ActivityTitle;
  id: string;
  asLink?: boolean;
}

export type ActivityStatus = "Pending" | "In Progress" | "Complete";

export const ACTIVITY_URI_BY_TITLE = {
  "Fishing for litter": "fishing-for-litter",
  Manufacturing: "manufacturing",
  Prevention: "prevention",
  Shredding: "shredding",
  Sorting: "sorting",
  Washing: "washing",
  Batch: "batch",
  "Beach Cleanup": "beach-cleanup",
  "Ad-hoc": "ad-hoc",
  Pelletizing: "pelletizing",
} as const;

export type ActivityTitleURI =
  (typeof ACTIVITY_URI_BY_TITLE)[keyof typeof ACTIVITY_URI_BY_TITLE];

export const ACTIVITY_TITLE_BY_URI = Object.entries(
  ACTIVITY_URI_BY_TITLE
).reduce((acc, [title, uri]) => {
  acc[uri as ActivityTitleURI] = title as ActivityTitle;
  return acc;
}, {} as Record<ActivityTitleURI, ActivityTitle>);
