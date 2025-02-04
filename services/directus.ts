import { Events, Events_Input, Events_Output } from "@/types/event";
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
    return await directus.request(readItems("Materials"));
  } catch (error: any) {
    throw formatDirectusError("Materials", error);
  }
}

export async function fetchActions() {
  try {
    return await directus.request(readItems("Actions"));
  } catch (error: any) {
    throw formatDirectusError("Actions", error);
  }
}

export async function fetchCollectors() {
  try {
    return await directus.request(readItems("Collectors"));
  } catch (error: any) {
    throw formatDirectusError("Collectors", error);
  }
}

export async function fetchProducts() {
  try {
    return await directus.request(readItems("Products"));
  } catch (error: any) {
    throw formatDirectusError("Products", error);
  }
}

export async function createEvent(event: Events) {
  try {
    return await directus.request(createItem("Events", event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}

export async function createMaterialInput(input: Events_Input) {
  try {
    return await directus.request(createItem("Events_Input", input));
  } catch (error: any) {
    throw formatDirectusError("MaterialInputs", error);
  }
}

export async function createMaterialOutput(output: Events_Output) {
  try {
    return await directus.request(createItem("Events_Output", output));
  } catch (error: any) {
    throw formatDirectusError("Events_Output", error);
  }
}

export async function updateEvent(eventId: number, event: Partial<Events>) {
  try {
    return await directus.request(updateItem("Events", eventId, event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}
