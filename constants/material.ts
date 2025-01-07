import {
  MaterialCategories,
  MaterialIdMap,
  MaterialNames,
  MaterialOptions,
} from "@/types/material";

// These will be populated from cache
export let MATERIAL_NAME_TO_ID: MaterialIdMap | undefined = undefined;
export let MATERIAL_ID_TO_NAME: Record<number, string> | undefined = undefined;
export let MATERIAL_OPTIONS: MaterialOptions | undefined = undefined;

export function updateMaterialConstants(materials: any[]) {
  MATERIAL_NAME_TO_ID = materials.reduce(
    (acc, material) => ({
      ...acc,
      [material.name]: material.id,
    }),
    {}
  );

  MATERIAL_ID_TO_NAME = Object.fromEntries(
    materials.map((material) => [material.id, material.name])
  );

  MATERIAL_OPTIONS = materials.map((material) => ({
    label: material.name as MaterialNames,
    value: material.id,
  }));
}
