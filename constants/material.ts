import {
  MaterialCategories,
  MaterialIdMap,
  MaterialNames,
  MaterialOptions,
} from "@/types/material";

const MATERIAL_CATEGORIES: Record<MaterialCategories, MaterialNames[]> = {
  Plastics: ["Mixed Plastics", "PP", "LDPE", "PE", "PS", "HDPE", "PET", "PA"],
  "Nets and Ropes": ["Prevention Nets", "Ghost Nets", "Nets", "Ropes"],
  "Other Materials": [
    "Mixed Materials",
    "Rubbers",
    "Non-Recyclables",
    "Metals",
    "Others",
  ],
} as const;

const MATERIAL_NAME_TO_ID: MaterialIdMap = {
  "Mixed Plastics": 1,
  Metals: 2,
  PP: 6,
  LDPE: 8,
  "Prevention Nets": 3,
  PE: 45,
  "Ghost Nets": 4,
  Others: 5,
  PS: 13,
  "Non-Recyclables": 11,
  HDPE: 7,
  PET: 9,
  Nets: 10,
  Rubbers: 43,
  PA: 44,
  Ropes: 46,
  "Mixed Materials": 47,
} as const;

const MATERIAL_ID_TO_NAME = Object.fromEntries(
  Object.entries(MATERIAL_NAME_TO_ID).map(([name, id]) => [id, name])
);

const MATERIAL_OPTIONS: MaterialOptions = Object.entries(
  MATERIAL_NAME_TO_ID
).map(([name, id]) => ({
  label: name as MaterialNames,
  value: id,
}));

export {
  MATERIAL_CATEGORIES,
  MATERIAL_NAME_TO_ID,
  MATERIAL_ID_TO_NAME,
  MATERIAL_OPTIONS,
};
