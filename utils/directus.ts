import { authentication, createDirectus, rest } from "@directus/sdk";

export const createDirectusClient = () => {
  const apiUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_DEV_API_URL is not set");
  }

  try {
    const client = createDirectus(apiUrl)
      .with(authentication("json"))
      .with(rest({ credentials: "include" }));
    console.log("[Directus] Client created successfully");
    return client;
  } catch (error) {
    console.error("[Directus] Client creation failed", error);
    throw error;
  }
};

export const directus = createDirectusClient();
