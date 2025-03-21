import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnaleiaUser } from "@/types/user";
import { directus } from "@/utils/directus";
import { readItem, readMe, updateMe, readItems } from "@directus/sdk";
import { useNetwork } from "./NetworkContext";
import { router } from "expo-router";
import { Company } from "@/types/company";
import { useWallet } from "./WalletContext";
import { EnaleiaDirectusSchema } from "@/types/enaleia";

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

// Add required collections that need to be checked for permissions
const REQUIRED_COLLECTIONS: (keyof EnaleiaDirectusSchema)[] = [
  "Companies",
  "Events",
  "Materials",
  "Products",
  "Collectors"
];

interface AuthContextType {
  user: EnaleiaUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<EnaleiaUser | void>;
  logout: () => Promise<void>;
  autoLogin: () => Promise<boolean>;
  lastLoggedInUser: string | null;
  offlineLogin: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnaleiaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoggedInUser, setLastLoggedInUser] = useState<string | null>(null);
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;
  const { createWallet, isWalletCreated, verifyWalletOwnership } = useWallet();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load last logged in user
        const email = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_EMAIL);
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

  // Enhanced permission verification
  const verifyDirectusPermissions = async (token: string): Promise<boolean> => {
    try {
      directus.setToken(token);
      
      // First verify we can read user data
      const userData = await directus.request(readMe());
      if (!userData) {
        console.log("[Auth] No user data found");
        return false;
      }

      // Verify access to required collections
      for (const collection of REQUIRED_COLLECTIONS) {
        try {
          // Try to read one item from each collection
          await directus.request(readItems(collection, { 
            limit: 1 
          }));
          console.log(`[Auth] Permission check passed for ${collection}`);
        } catch (error: any) {
          console.log(`[Auth] Permission check failed for ${collection}:`, error?.message);
          if (error?.message?.includes("FORBIDDEN") || 
              error?.message?.includes("don't have permission")) {
            return false;
          }
          // If error is not permission related (e.g. network error), throw it
          throw error;
        }
      }

      console.log("[Auth] All permission checks passed");
      return true;
    } catch (error: any) {
      console.error("[Auth] Permission verification failed:", error?.message);
      if (error?.message?.includes("FORBIDDEN") || 
          error?.message?.includes("don't have permission")) {
        return false;
      }
      throw error;
    }
  };

  // Login function following the flowchart
  const login = async (email: string, password: string): Promise<EnaleiaUser> => {
    setIsLoading(true);
    try {
      // Check internet status first
      if (!isOnline) {
        const success = await offlineLogin(email, password);
        if (!success) {
          throw new Error("Offline login failed");
        }
        // Return the user info from state since offlineLogin sets it
        return user!;
      }

      // Online login flow
      const loginResult = await directus.login(email, password);
      const token = loginResult.access_token;

      if (!token) {
        throw new Error("Invalid credentials");
      }

      // Verify credentials
      const isValid = await verifyDirectusPermissions(token);
      
      if (!isValid) {
        throw new Error("You don't have permission to access this account");
      }

      // Get user data
      const basicUserData = await directus.request(readMe());
      if (!basicUserData) {
        throw new Error("No user data found");
      }

      // All permissions OK - now store credentials
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN, token);
      if (loginResult.expires_at) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.TOKEN_EXPIRY,
          new Date(loginResult.expires_at).toISOString()
        );
      }

      if (loginResult.refresh_token) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.REFRESH_TOKEN,
          loginResult.refresh_token
        );
      }

      // Store credentials for offline login
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_EMAIL, email);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_PASSWORD, password);

      // Create user info
      let userInfo: EnaleiaUser = {
        id: basicUserData.id,
        first_name: basicUserData.first_name,
        last_name: basicUserData.last_name,
        email: basicUserData.email,
        wallet_address: basicUserData.wallet_address,
        token,
      };

      // Fetch company details if available
      if (basicUserData.Company) {
        try {
          const companyData = await directus.request(
            readItem("Companies", basicUserData.Company as number)
          );
          userInfo.Company = {
            id: companyData.id,
            name: companyData.name,
            coordinates: companyData.coordinates,
          };
        } catch (error) {
          console.warn("Failed to fetch company data:", error);
        }
      }

      // Store user info for offline access
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );

      // Handle wallet
      if (userInfo.wallet_address) {
        const isOwner = await verifyWalletOwnership(userInfo.wallet_address);
        if (!isOwner) {
          const walletInfo = await createWallet();
          await directus.request(updateMe({ wallet_address: walletInfo.address }));
          userInfo.wallet_address = walletInfo.address;
        }
      } else if (!isWalletCreated) {
        const walletInfo = await createWallet();
        await directus.request(updateMe({ wallet_address: walletInfo.address }));
        userInfo.wallet_address = walletInfo.address;
      }

      // Update state
      setUser(userInfo);
      setLastLoggedInUser(email);
      setIsLoading(false);
      return userInfo;

    } catch (error) {
      console.error("[Auth] Login failed:", error);
      // Clear any partially stored data
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
      ]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Offline login function
  const offlineLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check for cached credentials
      const storedEmail = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_EMAIL);
      const storedPassword = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_PASSWORD);
      
      if (!storedEmail || !storedPassword) {
        return false;
      }

      // Verify credentials match
      if (email !== storedEmail || password !== storedPassword) {
        return false;
      }

      // Get cached user info
      const userInfoString = await AsyncStorage.getItem(USER_STORAGE_KEYS.USER_INFO);
      if (!userInfoString) {
        return false;
      }

      // Set user state from cache
      const userInfo = JSON.parse(userInfoString) as EnaleiaUser;
      setUser(userInfo);
      return true;

    } catch (error) {
      console.error("Offline login failed:", error);
      return false;
    }
  };

  // Auto login function
  const autoLogin = async (): Promise<boolean> => {
    try {
      // Check internet status
      if (!isOnline) {
        // Try offline login with stored credentials
        const email = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_EMAIL);
        const password = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_PASSWORD);
        if (email && password) {
          return await offlineLogin(email, password);
        }
        return false;
      }

      // Online auto-login
      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
      if (!token) {
        return false;
      }

      // Verify permissions
      const isValid = await verifyDirectusPermissions(token);
      if (!isValid) {
        await logout();
        return false;
      }

      // Get fresh user data
      const basicUserData = await directus.request(readMe());
      if (!basicUserData) {
        throw new Error("No user data found");
      }

      let userInfo: EnaleiaUser = {
        id: basicUserData.id,
        first_name: basicUserData.first_name,
        last_name: basicUserData.last_name,
        email: basicUserData.email,
        wallet_address: basicUserData.wallet_address,
        token,
      };

      // Update cached user info
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );

      setUser(userInfo);
      return true;

    } catch (error) {
      console.error("Auto login failed:", error);
      await logout();
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      directus.setToken(null);
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER_EMAIL),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER_PASSWORD),
        AsyncStorage.removeItem(USER_STORAGE_KEYS.USER_INFO),
      ]);
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
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
