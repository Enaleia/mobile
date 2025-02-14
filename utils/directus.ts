import { EnaleiaSchema } from "@/types/enaliea";
import {
  authentication,
  createDirectus,
  rest,
  AuthenticationData,
  readMe,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "directus_auth_token";
const REFRESH_TOKEN_KEY = "directus_refresh_token";

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
  refreshToken: string
) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Set the token in the client for immediate use
  directus.setToken(accessToken);
}

export async function getStoredAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  directus.setToken(null);
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) return false;

    const result = await directus.refresh();
    if (!result?.access_token || !result?.refresh_token) return false;

    await storeAuthTokens(result.access_token, result.refresh_token);
    return true;
  } catch (error) {
    console.error("Failed to refresh auth token:", error);
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
    await clearAuthTokens();
    return null;
  }
}
