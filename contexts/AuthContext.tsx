import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnaleiaUser } from "@/types/user";
import { directus } from "@/utils/directus";
import { readItem, readMe, refresh } from "@directus/sdk";
import { useNetwork } from "./NetworkContext";
import { router } from "expo-router";
import { Company } from "@/types/company";
import { useWallet } from "./WalletContext";

// Secure storage keys
const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_EMAIL: "user_email",
  USER_PASSWORD: "user_password",
  TOKEN_EXPIRY: "token_expiry",
};

// AsyncStorage keys
const USER_STORAGE_KEYS = {
  USER_INFO: "user_info",
  LAST_LOGIN_DATE: "last_login_date",
};

interface AuthContextType {
  user: EnaleiaUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<EnaleiaUser | void>;
  logout: () => Promise<void>;
  autoLogin: () => Promise<boolean>;
  lastLoggedInUser: string | null;
  offlineLogin: (email: string, password: string) => Promise<boolean>;
  refreshTokenIfNeeded: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnaleiaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoggedInUser, setLastLoggedInUser] = useState<string | null>(null);
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;
  const { createWallet, isWalletCreated } = useWallet();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for last logged in user
        const email = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.USER_EMAIL
        );
        setLastLoggedInUser(email);

        // Try auto login
        await autoLogin();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("[Auth] Attempting login with email:", email);
      // Attempt to login with Directus
      const loginResult = await directus.login(email, password);
      console.log("[Auth] Login result received:", loginResult);
      const token = loginResult.access_token;

      if (!token) {
        console.error("[Auth] No token found in login result");
        throw new Error("No token found");
      }

      // Store credentials securely
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN, token);
      if (loginResult.expires_at) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.TOKEN_EXPIRY,
          new Date(loginResult.expires_at).toISOString()
        );
      }

      // Store refresh token if available
      if (loginResult.refresh_token) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.REFRESH_TOKEN,
          loginResult.refresh_token
        );
      }

      await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_EMAIL, email);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_PASSWORD, password);

      // Store last login date
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.LAST_LOGIN_DATE,
        new Date().toISOString()
      );

      // Set token in directus client
      directus.setToken(token);

      // Get user info
      const basicUserData = await directus.request(readMe());
      if (!basicUserData) throw new Error("No user data found");

      let userInfo: EnaleiaUser = {
        id: basicUserData.id,
        first_name: basicUserData.first_name,
        last_name: basicUserData.last_name,
        email: basicUserData.email,
        token,
      };

      // If user has a company, fetch company details
      if (basicUserData.Company) {
        try {
          const companyData = await directus.request(
            readItem("Companies", basicUserData.Company as number)
          );
          const company: Pick<Company, "id" | "name" | "coordinates"> = {
            id: companyData.id,
            name: companyData.name,
            coordinates: companyData.coordinates,
          };
          userInfo.Company = company;

          console.log("user company", company);
        } catch (error) {
          console.warn("Failed to fetch company data:", error);
        }
      }

      // Store user info in AsyncStorage for performance
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );

      // Create wallet if it doesn't exist
      if (!isWalletCreated) {
        try {
          await createWallet();
        } catch (error) {
          console.error("Failed to create wallet:", error);
          // Continue with login even if wallet creation fails
        }
      }

      // Update state
      setUser(userInfo);
      setLastLoggedInUser(email);

      return userInfo;
    } catch (error) {
      console.error("[Auth] Login failed with error:", error);
      if (error instanceof Error) {
        console.error("[Auth] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear tokens from directus client
      directus.setToken(null);

      // Clear all secure storage
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
        // Note: We keep USER_EMAIL and USER_PASSWORD for offline login capability
      ]);

      // Clear user info from AsyncStorage
      await AsyncStorage.removeItem(USER_STORAGE_KEYS.USER_INFO);

      // Update state
      setUser(null);

      // Navigate to login screen
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto login function
  const autoLogin = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try to get token from secure storage
      const token = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.AUTH_TOKEN
      );
      if (!token) {
        setIsLoading(false);
        return false;
      }

      // Check if token needs refresh
      const needsRefresh = !(await isTokenValid());
      if (needsRefresh) {
        const refreshed = await refreshTokenIfNeeded();
        if (!refreshed) {
          // Token refresh failed, try offline login
          const email = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.USER_EMAIL
          );
          const password = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.USER_PASSWORD
          );
          if (email && password) {
            return await offlineLogin(email, password);
          }
          await logout();
          return false;
        }
      }

      // Set token in directus client
      directus.setToken(token);

      // Try to get user info from AsyncStorage first (faster)
      const userInfoString = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.USER_INFO
      );

      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString) as EnaleiaUser;
        setUser(userInfo);
        setIsLoading(false);
        return true;
      }

      // If online, verify token and get fresh user data
      if (isOnline) {
        try {
          // Verify token by fetching user data
          const basicUserData = await directus.request(readMe());

          if (basicUserData) {
            let userInfo: EnaleiaUser = {
              id: basicUserData.id,
              first_name: basicUserData.first_name,
              last_name: basicUserData.last_name,
              email: basicUserData.email,
              token,
            };

            // If user has a company, fetch company details
            if (basicUserData.Company) {
              try {
                const companyData = await directus.request(
                  readItem("Companies", basicUserData.Company as number)
                );
                const company: Pick<Company, "id" | "name" | "coordinates"> = {
                  id: companyData.id,
                  name: companyData.name,
                  coordinates: companyData.coordinates,
                };
                userInfo.Company = company;
              } catch (error) {
                console.warn("Failed to fetch company data:", error);
              }
            }

            // Store user info in AsyncStorage for next time
            await AsyncStorage.setItem(
              USER_STORAGE_KEYS.USER_INFO,
              JSON.stringify(userInfo)
            );

            // Update state
            setUser(userInfo);
            setIsLoading(false);
            return true;
          }
        } catch (error) {
          console.warn("Token validation failed:", error);
          // Token might be invalid, try offline login if we have credentials
          const email = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.USER_EMAIL
          );
          const password = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.USER_PASSWORD
          );

          if (email && password) {
            return await offlineLogin(email, password);
          }
        }
      } else {
        // If offline, try to use stored user info
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString) as EnaleiaUser;
          setUser(userInfo);
          setIsLoading(false);
          return true;
        }

        // If no stored user info, try offline login with stored credentials
        const email = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.USER_EMAIL
        );
        const password = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.USER_PASSWORD
        );

        if (email && password) {
          return await offlineLogin(email, password);
        }
      }

      // If we get here, we couldn't validate the token or login offline
      await logout();
      return false;
    } catch (error) {
      console.error("Auto login failed:", error);
      await logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Offline login function
  const offlineLogin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Check if we have stored user info
      const userInfoString = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.USER_INFO
      );

      if (userInfoString) {
        const storedEmail = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.USER_EMAIL
        );

        // Verify email matches
        if (storedEmail === email) {
          const storedPassword = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.USER_PASSWORD
          );

          // Verify password matches
          if (storedPassword === password) {
            const userInfo = JSON.parse(userInfoString) as EnaleiaUser;
            setUser(userInfo);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Offline login failed:", error);
      return false;
    }
  };

  // Add new function to check token validity
  const isTokenValid = async (): Promise<boolean> => {
    try {
      const expiryStr = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.TOKEN_EXPIRY
      );
      if (!expiryStr) return false;

      const expiry = new Date(expiryStr);
      const now = new Date();

      // Consider token invalid if it expires in less than 24 days
      return expiry.getTime() - now.getTime() > 24 * 24 * 60 * 60 * 1000;
    } catch (error) {
      console.error("Error checking token validity:", error);
      return false;
    }
  };

  // Add new function to refresh token if needed
  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    try {
      const isValid = await isTokenValid();
      if (isValid) return true;

      const refreshToken = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.REFRESH_TOKEN
      );
      if (!refreshToken) return false;

      // Attempt to refresh token using SDK's refresh function
      const result = await directus.request(refresh("json", refreshToken));
      if (!result?.access_token) return false;

      // The SDK's authentication module will handle storing the tokens
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        autoLogin,
        lastLoggedInUser,
        offlineLogin,
        refreshTokenIfNeeded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
