export interface UIActivity {
  date: string;
  status: ActivityStatus;
  location: string;
  title: ActivityTitle;
  id: string;
  asLink?: boolean;
}

export type ActivityStatus = "Pending" | "In Progress" | "Complete";
export type ActivityTitle =
  | "Fishing for litter"
  | "Manufacturing"
  | "Prevention"
  | "Shredding"
  | "Sorting"
  | "Washing"
  | "Batch"
  | "Beach Cleanup"
  | "Ad-hoc"
  | "Pelletizing";
