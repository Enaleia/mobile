import { EventFormType } from "@/app/attest/new/[slug]";
import { EnaleiaEASSchema } from "@/types/enaleia";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { QueueItem } from "@/types/queue";
import { EnaleiaUser } from "@/types/user";

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

  return {
    // User & Company
    userID: userData?.id || "",
    portOrCompanyName: company?.name || "",
    portOrCompanyCoordinates: [0, 0], // Company type doesn't have coordinates in EnaleiaUser

    // Action & Date
    actionType: formType,
    actionDate: formDate,
    actionCoordinates: parseCoordinates(form.location?.coords) || [0, 0],

    // Collector
    collectorName: form.collectorId || "",

    // Incoming Materials
    incomingMaterials:
      form.incomingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    incomingWeightsKg: form.incomingMaterials?.map((m) => m.weight || 0) || [],
    incomingCodes: form.incomingMaterials?.map((m) => m.code || "") || [],

    // Outgoing Materials
    outgoingMaterials:
      form.outgoingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    outgoingWeightsKg: form.outgoingMaterials?.map((m) => m.weight || 0) || [],
    outgoingCodes: form.outgoingMaterials?.map((m) => m.code || "") || [],

    // Manufacturing
    productName: form.manufacturing?.product
      ? productsData.find((p) => p.product_id === form.manufacturing?.product)
          ?.product_name || ""
      : "",
    batchQuantity: form.manufacturing?.quantity || 0,
    weightPerItemKg: form.manufacturing?.weightInKg || 0,
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
  // Required fields must not be empty strings
  if (!data.userID) throw new Error("User ID is required");
  if (!data.portOrCompanyName)
    throw new Error("Port or company name is required");
  if (!data.actionType) throw new Error("Action type is required");
  if (!data.actionDate) throw new Error("Action date is required");

  // Arrays must be of equal length
  if (
    data.incomingMaterials.length !== data.incomingWeightsKg.length ||
    data.incomingMaterials.length !== data.incomingCodes.length
  ) {
    throw new Error(
      "Incoming materials, weights, and codes must have matching lengths"
    );
  }

  if (
    data.outgoingMaterials.length !== data.outgoingWeightsKg.length ||
    data.outgoingMaterials.length !== data.outgoingCodes.length
  ) {
    throw new Error(
      "Outgoing materials, weights, and codes must have matching lengths"
    );
  }

  // Coordinates must be valid numbers
  if (
    data.portOrCompanyCoordinates.some(isNaN) ||
    data.actionCoordinates.some(isNaN)
  ) {
    throw new Error("Invalid coordinates");
  }

  // All weights must be non-negative
  if (
    data.incomingWeightsKg.some((w) => w < 0) ||
    data.outgoingWeightsKg.some((w) => w < 0) ||
    data.weightPerItemKg < 0
  ) {
    throw new Error("Weights cannot be negative");
  }

  // Batch quantity must be non-negative
  if (data.batchQuantity < 0) {
    throw new Error("Batch quantity cannot be negative");
  }

  return true;
};
