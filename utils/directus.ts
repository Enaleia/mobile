import { EnaleiaSchema } from "@/types/enaliea";
import {
  authentication,
  createDirectus,
  rest,
  AuthenticationData,
  readMe,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Secure storage keys
const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
};

export const createDirectusClient = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }

  try {
    const client = createDirectus<EnaleiaSchema>(apiUrl)
      .with(authentication())
      .with(rest({ credentials: "include" }));
    console.log("[Directus] Client created successfully");
    return client;
  } catch (error) {
    console.error("[Directus] Client creation failed", error);
    throw error;
  }
};

export const directus = createDirectusClient();

export async function storeAuthTokens(
  accessToken: string,
  refreshToken?: string
) {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN, accessToken);

  if (refreshToken) {
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.REFRESH_TOKEN,
      refreshToken
    );
  }

  // Set the token in the client for immediate use
  directus.setToken(accessToken);
}

export async function getStoredAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
}

export async function clearAuthTokens() {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
  directus.setToken(null);
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      // If no refresh token, try to use the existing token
      const token = await getStoredAuthToken();
      if (!token) return false;

      try {
        // Verify if the token is still valid
        directus.setToken(token);
        await directus.request(readMe());
        return true;
      } catch (error) {
        console.error("Token validation failed:", error);
        await clearAuthTokens();
        return false;
      }
    }

    // If we have a refresh token, try to use it
    try {
      const result = await directus.refresh();
      if (!result?.access_token) return false;

      // Store the new access token
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.AUTH_TOKEN,
        result.access_token
      );

      // Store the new refresh token if available
      if (result.refresh_token) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.REFRESH_TOKEN,
          result.refresh_token
        );
      }

      directus.setToken(result.access_token);
      return true;
    } catch (error) {
      console.error("Failed to refresh auth token:", error);
      await clearAuthTokens();
      return false;
    }
  } catch (error) {
    console.error("Error in refreshAuthToken:", error);
    await clearAuthTokens();
    return false;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  const token = await getStoredAuthToken();
  if (!token) return null;

  try {
    // Try to use the current token
    directus.setToken(token);
    await directus.request(readMe());
    return token;
  } catch (error) {
    // Token might be expired, try to refresh
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      return await getStoredAuthToken();
    }

    // If refresh failed, clear tokens
    await clearAuthTokens();
    return null;
  }
}
