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

export type MaterialDetail = {
  id: number;
  weight: number;
  code: string | null;
};

export interface MaterialsData {
  nameToId: Record<string, number>;
  idToName: Record<number, string>;
  options: Array<{
    label: string;
    value: number;
  }>;
}

export const processMaterials = (materials: any[]): MaterialsData => {
  const nameToId = materials.reduce(
    (acc, material) => ({
      ...acc,
      [material.material_name]: material.material_id,
    }),
    {}
  );

  const idToName = Object.fromEntries(
    materials.map((material) => [material.material_id, material.material_name])
  );

  const options = materials.map((material) => ({
    label: material.material_name,
    value: material.material_id,
  }));

  return {
    nameToId,
    idToName,
    options,
  };
};
