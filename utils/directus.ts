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
import NetInfo from "@react-native-community/netinfo";

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
      .with(
        authentication("json", {
          autoRefresh: false, // We'll handle refresh manually based on network status
          msRefreshBeforeExpires: 5 * 60 * 1000,
        })
      )
      .with(rest({ credentials: "include" }));

    // Set up network-aware token refresh
    NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline) {
        // When we come online, check if we need to refresh
        refreshAuthToken().catch((error) => {
          console.error("Failed to refresh token on network restore:", error);
        });
      }
    });

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

// Add token expiration check
export async function isTokenExpiringSoon(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;

    // Check if token expires in next 5 minutes
    const expiresIn = payload.exp * 1000 - Date.now();
    return expiresIn < 5 * 60 * 1000;
  } catch {
    return true;
  }
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = await getStoredRefreshToken();
    const currentToken = await getStoredAuthToken();

    // If we have both tokens and current token isn't expiring, keep using it
    if (
      currentToken &&
      refreshToken &&
      !(await isTokenExpiringSoon(currentToken))
    ) {
      directus.setToken(currentToken);
      return true;
    }

    // If we have a refresh token, try to use it
    if (refreshToken) {
      try {
        // Set the refresh token for the refresh request
        directus.setToken(refreshToken);
        const result = await directus.refresh();
        if (!result?.access_token) {
          directus.setToken(null);
          return false;
        }

        await storeAuthTokens(
          result.access_token,
          result.refresh_token || undefined
        );
        return true;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        await clearAuthTokens();
        return false;
      }
    }

    // No refresh token, check if current token is still valid
    if (currentToken) {
      try {
        directus.setToken(currentToken);
        await directus.request(readMe());
        return true;
      } catch {
        await clearAuthTokens();
        return false;
      }
    }

    directus.setToken(null);
    return false;
  } catch (error) {
    console.error("Error in refreshAuthToken:", error);
    await clearAuthTokens();
    return false;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  try {
    const token = await getStoredAuthToken();
    if (!token) return null;

    // If token is expiring soon or refresh fails, clear tokens and return null
    if (await isTokenExpiringSoon(token)) {
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        await clearAuthTokens();
        return null;
      }
      return await getStoredAuthToken();
    }

    directus.setToken(token);
    return token;
  } catch (error) {
    console.error("Error ensuring valid token:", error);
    await clearAuthTokens();
    return null;
  }
}

// Update QueryClient settings to be more aggressive with refetching
export const getQueryClientConfig = () => ({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount: number, error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Don't retry on auth errors
        if (
          errorMessage.includes("FORBIDDEN") ||
          errorMessage.includes("TOKEN_EXPIRED") ||
          errorMessage.includes("TOKEN_INVALID")
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
