import { createDirectus, rest } from "@directus/sdk";

const useDirectus = () => {
  const apiUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_DEV_API_URL is not set");
  }
  try {
    const client = createDirectus(apiUrl).with(rest());
    console.log("[Directus] Client created successfully");
    return { client };
  } catch (error) {
    console.error("[Directus] Client creation failed", error);
    throw error;
  }
};

export default useDirectus;
