// TODO: Get all the data from the tables, not just the first 100
// TODO: Update the fields to only get the ones required
import {
  MaterialTrackingEvent,
  MaterialTrackingEventInput,
  MaterialTrackingEventOutput,
} from "@/types/event";
import { directus } from "@/utils/directus";
import { createItem, readItems, updateItem } from "@directus/sdk";

function formatDirectusError(endpoint: string, error: any): Error {
  const errorMessage =
    error.errors?.[0]?.message || error.message || "Unknown error";
  const errorCode = error.errors?.[0]?.extensions?.code || "UNKNOWN_ERROR";
  return new Error(
    `[Directus] Failed to fetch ${endpoint}: ${errorMessage} (${errorCode})`
  );
}

export async function fetchMaterials() {
  try {
    return await directus.request(readItems("Materials", {limit:-1}));
  } catch (error: any) {
    throw formatDirectusError("Materials", error);
  }
}

export async function fetchActions() {
  try {
    return await directus.request(readItems("Actions", {limit:-1}));
  } catch (error: any) {
    throw formatDirectusError("Actions", error);
  }
}

export async function fetchCollectors() {
  try {
    return await directus.request(readItems("Collectors", {limit:-1}));
  } catch (error: any) {
    throw formatDirectusError("Collectors", error);
  }
}

export async function fetchProducts() {
  try {
    return await directus.request(readItems("Products", {
      limit: -1,
      fields: ['*', 'manufactured_by.name']
    }));
  } catch (error: any) {
    throw formatDirectusError("Products", error);
  }
}

export async function createEvent(event: MaterialTrackingEvent) {
  try {
    return await directus.request(createItem("Events", event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}

export async function createMaterialInput(input: MaterialTrackingEventInput) {
  try {
    return await directus.request(createItem("Events_Input", input));
  } catch (error: any) {
    throw formatDirectusError("MaterialInputs", error);
  }
}

export async function createMaterialOutput(
  output: MaterialTrackingEventOutput
) {
  try {
    return await directus.request(createItem("Events_Output", output));
  } catch (error: any) {
    throw formatDirectusError("Events_Output", error);
  }
}

export async function updateEvent(
  eventId: number,
  event: Partial<MaterialTrackingEvent>
) {
  try {
    return await directus.request(updateItem("Events", eventId, event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}
