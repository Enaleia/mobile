import { EventFormType } from "@/app/attest/new/[slug]";
import { EnaleiaEASSchema } from "@/types/enaleia";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { QueueItem } from "@/types/queue";
import { EnaleiaUser } from "@/types/user";

// New coordinate precision: Store as `string[]`
const COORDINATE_PRECISION = 100000; // 1e5 (1-meter accuracy)

export const convertCoordinatesToString = (
  coords: [number, number]
): string[] => {
  return [
    (Math.round(coords[0] * COORDINATE_PRECISION) / COORDINATE_PRECISION).toFixed(5), // Latitude
    (Math.round(coords[1] * COORDINATE_PRECISION) / COORDINATE_PRECISION).toFixed(5), // Longitude
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
    typeof userData?.Company === "number" ? undefined : userData?.Company;

  //  Convert coordinates to `string[]`
  const actionCoordinates: string[] = form.location?.coords
    ? convertCoordinatesToString([
        form.location.coords.latitude,
        form.location.coords.longitude,
      ])
    : ["0.00000", "0.00000"];

  const companyCoordinates: string[] = userData?.Company?.location
    ? convertCoordinatesToString([
        userData.Company.location.latitude,
        userData.Company.location.longitude,
      ])
    : ["0.00000", "0.00000"];

  //  Convert weights to `uint16[]` (max value 65535)
  const incomingWeightsKg: number[] =
    form.incomingMaterials?.map((m) => Math.min(Math.round((m.weight || 0) * 1000), 65535)) ||
    [];
  const outgoingWeightsKg: number[] =
    form.outgoingMaterials?.map((m) => Math.min(Math.round((m.weight || 0) * 1000), 65535)) ||
    [];
  const weightPerItemKg = Math.min(Math.round((form.manufacturing?.weightInKg || 0) * 1000), 65535);
  const batchQuantity = Math.min(form.manufacturing?.quantity || 0, 65535);

  return {
    userID: userData?.id || "",
    portOrCompanyName: company?.name || "",
    portOrCompanyCoordinates: companyCoordinates, //  Now `string[]`

    actionType: formType,
    actionDate: formDate,
    actionCoordinates: actionCoordinates, // Now `string[]`

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
 * Parses coordinates from various formats into a number array
 */
export const parseCoordinates = (
  coords: string | { latitude: number; longitude: number } | undefined
): number[] => {
  if (!coords) return [0, 0];

  if (typeof coords === "string") {
    const [lat, lng] = coords.split(",").map(Number);
    return [lat, lng];
  }

  return [coords.latitude, coords.longitude];
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
    data.incomingWeightsKg.some((w) => w < 0 || w > 65535) ||
    data.outgoingWeightsKg.some((w) => w < 0 || w > 65535) ||
    (data.weightPerItemKg !== 0 && (data.weightPerItemKg < 0 || data.weightPerItemKg > 65535))
  ) {
    throw new Error("Weights must be within uint16 range (0-65535)");
  }

  if (data.batchQuantity !== 0 && (data.batchQuantity < 0 || data.batchQuantity > 65535)) {
    throw new Error("Batch quantity must be within uint16 range (0-65535)");
  }

  return true;
};