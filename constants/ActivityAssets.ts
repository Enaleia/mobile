import AdHocIcon from "@assets/images/action-icons/Ad-hoc.webp";
import BatchIcon from "@assets/images/action-icons/Batch.webp";
import BeachCleanupIcon from "@assets/images/action-icons/Beach Cleanup.webp";
import FishingForLitterIcon from "@assets/images/action-icons/Fishing for Litter.webp";
import ManufacturingIcon from "@assets/images/action-icons/Manufacturing.webp";
import PelletizingIcon from "@assets/images/action-icons/Pelletizing.webp";
import PreventionIcon from "@assets/images/action-icons/Prevention.webp";
import ShreddingIcon from "@assets/images/action-icons/Shredding.webp";
import SortingIcon from "@assets/images/action-icons/Sorting.webp";
import WashingIcon from "@assets/images/action-icons/Washing.webp";

const icons = {
  AdHocIcon,
  BatchIcon,
  BeachCleanupIcon,
  FishingForLitterIcon,
  ManufacturingIcon,
  PelletizingIcon,
  PreventionIcon,
  ShreddingIcon,
  SortingIcon,
  WashingIcon,
} as const;

export const ACTIVITY_ICONS = {
  "Fishing for litter": FishingForLitterIcon,
  Manufacturing: ManufacturingIcon,
  Prevention: PreventionIcon,
  Shredding: ShreddingIcon,
  Sorting: SortingIcon,
  Washing: WashingIcon,
  Batch: BatchIcon,
  "Beach Cleanup": BeachCleanupIcon,
  "Ad-hoc": AdHocIcon,
  Pelletizing: PelletizingIcon,
} as const;

export type ActivityTitle = keyof typeof ACTIVITY_ICONS;

export default icons;
