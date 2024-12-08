export type MaterialNames =
  | "Mixed Plastics"
  | "Metals"
  | "Prevention Nets"
  | "Ghost Nets"
  | "Others"
  | "PP"
  | "HDPE"
  | "LDPE"
  | "PET"
  | "Nets"
  | "Non-Recyclables"
  | "PS"
  | "Rubbers"
  | "PA"
  | "PE"
  | "Ropes"
  | "Mixed Materials";

export type MaterialOption = {
  label: MaterialNames;
  value: number;
};

export type MaterialCategories =
  | "Plastics"
  | "Nets and Ropes"
  | "Other Materials";

export type MaterialOptions = MaterialOption[];

export type MaterialIdMap = Record<MaterialNames, number>;
