import { EventFormType } from "@/app/attest/new/[slug]";
import { Company } from "@/types/company";
import { EnaleiaEASSchema } from "@/types/enaleia";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { QueueItem } from "@/types/queue";
import { EnaleiaUser } from "@/types/user";

export const convertCoordinatesToString = (
  coords: [number, number]
): string[] => {
  return [
    coords[0].toFixed(5), // Latitude
    coords[1].toFixed(5), // Longitude
  ];
};

/**
 * Maps form data to EAS schema format
 */
export const mapToEASSchema = (
  form: EventFormType | QueueItem,
  userData: EnaleiaUser | null,
  materialsData: DirectusMaterial[],
  productsData: Pick<
    DirectusProduct,
    "product_id" | "product_name" | "product_type"
  >[]
): EnaleiaEASSchema => {
  const formType = "actionName" in form ? form.actionName : form.type;
  const formDate = form.date;

  const company =
    typeof userData?.Company === "number"
      ? undefined
      : (userData?.Company as Pick<Company, "id" | "name" | "coordinates">);

  const actionCoordinates: string[] = form.location?.coords
    ? convertCoordinatesToString([
        form.location.coords.latitude,
        form.location.coords.longitude,
      ])
    : ["0.00000", "0.00000"];

  const companyCoordinates: string[] = company?.coordinates
    ? company.coordinates.split(",").map((coord: string) => coord.trim())
    : ["0.00000", "0.00000"];

  const incomingWeightsKg: number[] =
    form.incomingMaterials?.map((m) => m.weight || 0) || [];
  const outgoingWeightsKg: number[] =
    form.outgoingMaterials?.map((m) => m.weight || 0) || [];
  const weightPerItemKg = form.manufacturing?.weightInKg || 0;
  const batchQuantity = form.manufacturing?.quantity || 0;

  return {
    userID: userData?.id || "",
    portOrCompanyName: company?.name || "",
    portOrCompanyCoordinates: companyCoordinates,

    actionType: formType,
    actionDate: formDate,
    actionCoordinates: actionCoordinates,

    collectorName: form.collectorId || "",

    incomingMaterials:
      form.incomingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    incomingWeightsKg,
    incomingCodes: form.incomingMaterials?.map((m) => m.code || "") || [],

    outgoingMaterials:
      form.outgoingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    outgoingWeightsKg,
    outgoingCodes: form.outgoingMaterials?.map((m) => m.code || "") || [],

    productName: form.manufacturing?.product
      ? productsData.find((p) => p.product_id === form.manufacturing?.product)
          ?.product_name || ""
      : "",
    batchQuantity,
    weightPerItemKg,
  };
};

/**
 * Validates the EAS schema data before attestation
 */
export const validateEASSchema = (data: EnaleiaEASSchema): boolean => {
  if (
    !Array.isArray(data.incomingMaterials) ||
    !Array.isArray(data.incomingWeightsKg) ||
    !Array.isArray(data.incomingCodes) ||
    !Array.isArray(data.outgoingMaterials) ||
    !Array.isArray(data.outgoingWeightsKg) ||
    !Array.isArray(data.outgoingCodes)
  ) {
    throw new Error("Material arrays must be valid arrays (can be empty)");
  }

  if (
    data.incomingMaterials.length > 0 &&
    (data.incomingMaterials.length !== data.incomingWeightsKg.length ||
      data.incomingMaterials.length !== data.incomingCodes.length)
  ) {
    throw new Error(
      "Incoming materials, weights, and codes must have matching lengths"
    );
  }

  if (
    data.outgoingMaterials.length > 0 &&
    (data.outgoingMaterials.length !== data.outgoingWeightsKg.length ||
      data.outgoingMaterials.length !== data.outgoingCodes.length)
  ) {
    throw new Error(
      "Outgoing materials, weights, and codes must have matching lengths"
    );
  }

  if (
    data.incomingWeightsKg.some((w) => w < 0) ||
    data.outgoingWeightsKg.some((w) => w < 0) ||
    (data.weightPerItemKg !== 0 && data.weightPerItemKg < 0)
  ) {
    throw new Error("Weights must be non-negative");
  }

  if (data.batchQuantity !== 0 && data.batchQuantity < 0) {
    throw new Error("Batch quantity must be non-negative");
  }

  return true;
};
