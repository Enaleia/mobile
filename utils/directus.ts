import { EnaleiaSchema } from "@/types/enaliea";
import {
  authentication,
  createDirectus,
  rest,
  AuthenticationData,
  readMe,
  refresh,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";

// Secure storage keys
const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_EXPIRY: "token_expiry",
};

// Custom storage implementation for Directus auth
class SecureStorage {
  async get(): Promise<AuthenticationData | null> {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
      ]);

      if (!accessToken) return null;

      return {
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        expires: expiresAt ? new Date(expiresAt).getTime() : null,
        expires_at: expiresAt ? new Date(expiresAt).getTime() : null,
      };
    } catch (error) {
      console.error("Error reading from secure storage:", error);
      return null;
    }
  }

  async set(data: AuthenticationData | null) {
    try {
      if (!data) {
        await Promise.all([
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
        ]);
        return;
      }

      let promises: Promise<void>[] = [];

      if (data.access_token) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.AUTH_TOKEN,
            data.access_token
          )
        );
      }

      if (data.refresh_token) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.REFRESH_TOKEN,
            data.refresh_token
          )
        );
      }

      if (data.expires_at) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.TOKEN_EXPIRY,
            new Date(data.expires_at).toISOString()
          )
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error writing to secure storage:", error);
    }
  }
}

export const createDirectusClient = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }

  try {
    const storage = new SecureStorage();
    const client = createDirectus<EnaleiaSchema>(apiUrl)
      .with(
        authentication("json", {
          storage,
          autoRefresh: true,
          msRefreshBeforeExpires: 24 * 60 * 60 * 1000, // Refresh 24 hours before expiry
        })
      )
      .with(rest({ credentials: "include" }));

    // Set up network-aware token refresh
    NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline) {
        // When we come online, check if we need to refresh
        storage.get().then(async (authData) => {
          if (!authData?.refresh_token) return;

          try {
            // Check token expiry
            const expiryStr = await SecureStore.getItemAsync(
              SECURE_STORE_KEYS.TOKEN_EXPIRY
            );
            const now = new Date();

            // Only refresh if token expires in less than 24 hours
            if (
              !expiryStr ||
              new Date(expiryStr).getTime() - now.getTime() <
                24 * 60 * 60 * 1000
            ) {
              console.log("Token expired or near expiry, attempting refresh");
              await client.request(refresh("json", authData.refresh_token));
            } else {
              console.log("Token still valid, no refresh needed");
            }
          } catch (error) {
            console.error("Failed to refresh token on network restore:", error);
          }
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

export async function getStoredAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
}

export async function clearAuthTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
  ]);
  directus.setToken(null);
}

// Update token expiration check to use stored expiry
export async function isTokenExpiringSoon(): Promise<boolean> {
  try {
    const expiryStr = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.TOKEN_EXPIRY
    );
    if (!expiryStr) return true;

    const expiry = new Date(expiryStr);
    const now = new Date();

    // Consider token expiring soon if it expires in less than 24 hours
    return expiry.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true;
  }
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    // First try using refresh token
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      try {
        const result = await directus.request(refresh("json", refreshToken));
        if (result?.access_token) {
          return true;
        }
      } catch (error) {
        console.log("Refresh token failed, trying stored credentials");
      }
    }

    // If refresh token fails, try stored credentials
    const email = await SecureStore.getItemAsync("user_email");
    const password = await SecureStore.getItemAsync("user_password");

    if (!email || !password) {
      await clearAuthTokens();
      return false;
    }

    try {
      await directus.login(email, password);
      return true;
    } catch (error) {
      console.error("Failed to refresh with stored credentials:", error);
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
  try {
    const token = await getStoredAuthToken();
    if (!token) return null;

    // If token is expiring soon or refresh fails, clear tokens and return null
    if (await isTokenExpiringSoon()) {
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
