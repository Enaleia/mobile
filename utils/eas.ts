import { EventFormType } from "@/app/attest/new/[slug]";
import { DirectusCollector } from "@/types/collector";
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
  >[],
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity"
  >[]
): EnaleiaEASSchema => {
  try {
    const formType = "type" in form ? form.type : form.actionName;
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
    const weightPerItemKg = form.manufacturing?.weightInKg?.toString() || "";
    const batchQuantity = form.manufacturing?.quantity || 0;

    const schema: EnaleiaEASSchema = {
      userID: userData?.id || "",
      portOrCompanyName: company?.name || "",
      portOrCompanyCoordinates: companyCoordinates,

      actionType: formType,
      actionDate: formDate,
      actionCoordinates: actionCoordinates,

      collectorName:
        collectors.find((c) => c.collector_identity === form.collectorId)
          ?.collector_name || "",

      incomingMaterials:
        form.incomingMaterials?.map(
          (m) =>
            materialsData.find((md) => md.material_id === m.id)?.material_name ||
            ""
        ) || [],
      incomingWeightsKg,
      incomingCodes: form.incomingMaterials?.map(
        (m) => m.code || form.collectorId || ""
      ) || [],

      outgoingMaterials:
        form.outgoingMaterials?.map(
          (m) =>
            materialsData.find((md) => md.material_id === m.id)?.material_name ||
            ""
        ) || [],
      outgoingWeightsKg,
      outgoingCodes: form.outgoingMaterials?.map(
        (m) => m.code || ""
      ) || [],

      productName: form.manufacturing?.product
        ? productsData.find((p) => p.product_id === form.manufacturing?.product)
            ?.product_name || ""
        : "",
      batchQuantity,
      weightPerItemKg,
    };

    console.log("[EAS] Successfully mapped schema:", { 
      actionType: schema.actionType,
      incomingMaterialsCount: schema.incomingMaterials.length,
      outgoingMaterialsCount: schema.outgoingMaterials.length
    });

    return schema;
  } catch (error) {
    console.error("[EAS] Error mapping schema:", error);
    throw error;
  }
};

/**
 * Validates the EAS schema data before attestation
 */
export const validateEASSchema = (data: EnaleiaEASSchema): boolean => {
  try {
    console.log("[EAS] Validating schema data");
    
    // Keep all materials, even those with zero weights or empty codes
    const validIncomingMaterials = data.incomingMaterials;
    const validIncomingWeights = data.incomingWeightsKg;
    const validIncomingCodes = data.incomingCodes;

    const validOutgoingMaterials = data.outgoingMaterials;
    const validOutgoingWeights = data.outgoingWeightsKg;
    const validOutgoingCodes = data.outgoingCodes;

    // Update the arrays in the data object
    data.incomingMaterials = validIncomingMaterials;
    data.incomingWeightsKg = validIncomingWeights;
    data.incomingCodes = validIncomingCodes;
    data.outgoingMaterials = validOutgoingMaterials;
    data.outgoingWeightsKg = validOutgoingWeights;
    data.outgoingCodes = validOutgoingCodes;

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

    if (
      data.incomingWeightsKg.some((w) => w < 0) ||
      data.outgoingWeightsKg.some((w) => w < 0) ||
      (data.weightPerItemKg !== "0" && parseFloat(data.weightPerItemKg) < 0)
    ) {
      throw new Error("Weights must be non-negative");
    }

    if (data.batchQuantity !== 0 && data.batchQuantity < 0) {
      throw new Error("Batch quantity must be non-negative");
    }

    console.log("[EAS] Schema validation successful");
    return true;
  } catch (error) {
    console.error("[EAS] Schema validation failed:", error);
    throw error;
  }
};

export async function fundWallet(address: string) {
  if (!process.env.EXPO_PUBLIC_FUNDING_URL) {
    throw new Error("FUNDING_URL is not set");
  }

  try {
    console.log("[EAS] Funding wallet:", address);
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_FUNDING_URL}/fund-address?address=${address}`
    );
    const data: { info: string } = await response.json();
    console.log("[EAS] Funding successful:", data);
    return data.info;
  } catch (error) {
    console.error("[EAS] Funding failed:", error);
    throw new Error(
      `Funding failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getWalletBalance(address: string) {
  if (!process.env.EXPO_PUBLIC_FUNDING_URL) {
    throw new Error("FUNDING_URL is not set");
  }

  try {
    console.log("[EAS] Getting wallet balance:", address);
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_FUNDING_URL}/get-balance?address=${address}`
    );
    const data: { balance: string } = await response.json();
    console.log("[EAS] Balance retrieved:", data);
    return data.balance;
  } catch (error) {
    console.error("[EAS] Balance check failed:", error);
    throw new Error(
      `Balance check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
