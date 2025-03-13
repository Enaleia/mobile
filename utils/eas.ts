import { EventFormType } from "@/app/attest/new/[slug]";
import { EnaleiaEASSchema } from "@/types/enaleia";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { QueueItem } from "@/types/queue";
import { EnaleiaUser } from "@/types/user";

// Convert coordinates to uint64 format by:
// 1. Adding 180 to shift range from [-180,180] to [0,360] for longitude
// 2. Adding 90 to shift range from [-90,90] to [0,180] for latitude
// 3. Multiplying by 1e7 to preserve 7 decimal places
const COORDINATE_PRECISION = 10000000; // 1e7

export const convertCoordinatesToUint = (
  coords: [number, number]
): [number, number] => {
  const [lng, lat] = coords;
  return [
    Math.round((lng + 180) * COORDINATE_PRECISION),
    Math.round((lat + 90) * COORDINATE_PRECISION),
  ];
};

/**
 * Maps form data to EAS schema format
 * @param form - The form data from the attestation form or queue item
 * @param userData - The current user's data including company info
 * @param materialsData - List of all materials for name lookup
 * @param productsData - List of all products for name lookup
 * @returns EnaleiaEASSchema formatted data ready for attestation
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
  // If form is a QueueItem, we need to handle it differently
  const formType = "actionName" in form ? form.actionName : form.type;
  const formDate = form.date;

  // Handle Company data which could be a number or an object
  const company =
    typeof userData?.Company === "number" ? undefined : userData?.Company;

  // Convert location coordinates to uint64 format
  const actionCoordinates = form.location?.coords
    ? convertCoordinatesToUint([
        form.location.coords.longitude,
        form.location.coords.latitude,
      ])
    : [0, 0];

  // Default company coordinates
  const companyCoordinates: [number, number] = [0, 0];

  // Convert weights to non-negative integers (multiply by 1000 to preserve 3 decimal places)
  const incomingWeightsKg =
    form.incomingMaterials?.map((m) => Math.round((m.weight || 0) * 1000)) ||
    [];
  const outgoingWeightsKg =
    form.outgoingMaterials?.map((m) => Math.round((m.weight || 0) * 1000)) ||
    [];
  const weightPerItemKg = Math.round(
    (form.manufacturing?.weightInKg || 0) * 1000
  );

  return {
    // User & Company
    userID: userData?.id || "",
    portOrCompanyName: company?.name || "",
    portOrCompanyCoordinates: companyCoordinates,

    // Action & Date
    actionType: formType,
    actionDate: formDate,
    actionCoordinates: actionCoordinates,

    // Collector
    collectorName: form.collectorId || "",

    // Incoming Materials
    incomingMaterials:
      form.incomingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    incomingWeightsKg,
    incomingCodes: form.incomingMaterials?.map((m) => m.code || "") || [],

    // Outgoing Materials
    outgoingMaterials:
      form.outgoingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    outgoingWeightsKg,
    outgoingCodes: form.outgoingMaterials?.map((m) => m.code || "") || [],

    // Manufacturing
    productName: form.manufacturing?.product
      ? productsData.find((p) => p.product_id === form.manufacturing?.product)
          ?.product_name || ""
      : "",
    batchQuantity: form.manufacturing?.quantity || 0,
    weightPerItemKg,
  };
};

/**
 * Parses coordinates from various formats into a number array
 * @param coords - Coordinates in string format "lat,lng" or object format {latitude, longitude}
 * @returns Array of [latitude, longitude] as numbers
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
 * @param data - The formatted EAS schema data
 * @returns true if valid, throws error if invalid
 */
export const validateEASSchema = (data: EnaleiaEASSchema): boolean => {
  // Only validate that arrays exist and are arrays (can be empty)
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

  // Arrays must still be of equal length if they have items
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

  // Only validate weights if they are present and not zero
  if (
    data.incomingWeightsKg.some((w) => w < 0) ||
    data.outgoingWeightsKg.some((w) => w < 0) ||
    (data.weightPerItemKg !== 0 && data.weightPerItemKg < 0)
  ) {
    throw new Error("Weights cannot be negative");
  }

  // Only validate batch quantity if it's present and not zero
  if (data.batchQuantity !== 0 && data.batchQuantity < 0) {
    throw new Error("Batch quantity cannot be negative");
  }

  return true;
};
