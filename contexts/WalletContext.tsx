import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { WalletInfo, WalletContextType } from "@/types/wallet";
import { EAS } from "@/utils/eas-wrapper";

const SECURE_STORE_KEYS = {
  WALLET_MNEMONIC: "wallet_mnemonic",
  WALLET_PRIVATE_KEY: "wallet_private_key",
  WALLET_ADDRESS: "wallet_address",
  SCHEMA_UID: "schema_uid",
};

const PROVIDER_URLS = {
  sepolia: "https://sepolia.optimism.io",
  optimism: "https://mainnet.optimism.io",
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
      const schemaUID = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.SCHEMA_UID
      );

      if (address && privateKey) {
        const network =
          process.env.EXPO_PUBLIC_NETWORK === "production"
            ? "optimism"
            : "sepolia";
        const walletInfo: WalletInfo = {
          address,
          network,
          schemaUID: schemaUID || undefined,
        };
        setWallet(walletInfo);
        setIsWalletCreated(true);

        // Initialize EAS helper
        const providerUrl = PROVIDER_URLS[network];
        setEasHelper(new EAS(providerUrl, privateKey));
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    }
  };

  const createWallet = async (): Promise<WalletInfo> => {
    try {
      // Generate mnemonic
      const mnemonic = EAS.generateMnemonic();

      // Derive private key
      const privateKey = EAS.getPrivateKeyFromMnemonic(mnemonic);
      if (!privateKey) throw new Error("Failed to derive private key");

      // Get address
      const address = EAS.getAddressFromPrivateKey(privateKey);
      if (!address) throw new Error("Failed to derive address");

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
      const walletInfo: WalletInfo = { address, network };

      setWallet(walletInfo);
      setIsWalletCreated(true);

      // Initialize EAS helper
      const providerUrl = PROVIDER_URLS[network];
      setEasHelper(new EAS(providerUrl, privateKey));

      return walletInfo;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{ wallet, createWallet, isWalletCreated, easHelper }}
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
