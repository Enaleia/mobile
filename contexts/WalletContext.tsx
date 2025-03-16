import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { WalletInfo, WalletContextType } from "@/types/wallet";
import { EAS } from "eas-lib";
import { EAS_CONSTANTS } from "@/services/eas";

const SECURE_STORE_KEYS = {
  WALLET_MNEMONIC: "wallet_mnemonic",
  WALLET_PRIVATE_KEY: "wallet_private_key",
  WALLET_ADDRESS: "wallet_address",
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isWalletCreated, setIsWalletCreated] = useState(false);
  const [easHelper, setEasHelper] = useState<EAS | null>(null);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const address = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.WALLET_ADDRESS
      );
      const privateKey = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.WALLET_PRIVATE_KEY
      );

      if (address && privateKey) {
        const network =
          process.env.EXPO_PUBLIC_NETWORK === "production"
            ? "optimism"
            : "sepolia";
        const providerUrl = EAS_CONSTANTS.PROVIDER_URLS[network];
        if (!providerUrl) {
          throw new Error(`No provider URL found for network: ${network}`);
        }
        const walletInfo: WalletInfo = {
          address,
          network,
          schemaUID: EAS_CONSTANTS.SCHEMA_UID,
          providerUrl,
          privateKey,
        };
        setWallet(walletInfo);
        setIsWalletCreated(true);

        // Initialize EAS helper
        setEasHelper(
          new EAS(
            providerUrl,
            privateKey,
            EAS_CONSTANTS.SCHEMA,
            EAS_CONSTANTS.SCHEMA_UID
          )
        );
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    }
  };

  const createWallet = async (): Promise<WalletInfo> => {
    try {
      // Generate mnemonic
      const mnemonic = EAS.generateMnemonic();
      const privateKey = EAS.getPrivateKeyFromMnemonic(mnemonic);
      if (!privateKey) throw new Error("Failed to derive private key");
      const address = EAS.getAddressFromPrivateKey(privateKey);
      if (!address) throw new Error("Failed to derive address");
      console.log("[Wallet] Created new wallet:", address);

      // Store securely
      await Promise.all([
        SecureStore.setItemAsync(
          SECURE_STORE_KEYS.WALLET_MNEMONIC,
          mnemonic.join(" ")
        ),
        SecureStore.setItemAsync(
          SECURE_STORE_KEYS.WALLET_PRIVATE_KEY,
          privateKey
        ),
        SecureStore.setItemAsync(SECURE_STORE_KEYS.WALLET_ADDRESS, address),
      ]);

      const network =
        process.env.EXPO_PUBLIC_NETWORK === "production"
          ? "optimism"
          : "sepolia";
      const providerUrl = EAS_CONSTANTS.PROVIDER_URLS[network];
      if (!providerUrl) {
        throw new Error(`No provider URL found for network: ${network}`);
      }
      const walletInfo: WalletInfo = {
        address,
        network,
        schemaUID: EAS_CONSTANTS.SCHEMA_UID,
        providerUrl,
        privateKey,
      };

      setWallet(walletInfo);
      setIsWalletCreated(true);
      console.log("[Wallet] Wallet creation complete");

      // Initialize EAS helper
      setEasHelper(
        new EAS(
          providerUrl,
          privateKey,
          EAS_CONSTANTS.SCHEMA,
          EAS_CONSTANTS.SCHEMA_UID
        )
      );
      console.log("[Wallet] EAS helper initialized");

      return walletInfo;
    } catch (error) {
      console.error("[Wallet] Error creating wallet:", error);
      throw error;
    }
  };

  // Add function to verify wallet ownership
  const verifyWalletOwnership = async (address: string): Promise<boolean> => {
    try {
      const storedPrivateKey = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.WALLET_PRIVATE_KEY
      );
      if (!storedPrivateKey) {
        console.log("[Wallet] No private key found in secure storage");
        return false;
      }

      const derivedAddress = EAS.getAddressFromPrivateKey(storedPrivateKey);
      const isOwner = derivedAddress === address;
      console.log(
        "[Wallet] Ownership verification:",
        isOwner ? "success" : "failed"
      );
      return isOwner;
    } catch (error) {
      console.error("[Wallet] Error verifying wallet ownership:", error);
      return false;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        createWallet,
        isWalletCreated,
        easHelper,
        verifyWalletOwnership,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
