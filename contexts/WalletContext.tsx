import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { WalletInfo, WalletContextType } from "@/types/wallet";
import { EAS } from "eas-lib";

const SECURE_STORE_KEYS = {
  WALLET_MNEMONIC: "wallet_mnemonic",
  WALLET_PRIVATE_KEY: "wallet_private_key",
  WALLET_ADDRESS: "wallet_address",
};

const schema = "uint256 eventId, string[] weights, string comment";
const schemaUID =
  "0x6123441ae23c2a9ef6c0dfa07ac6ad5bb9a7950c4759e4b5989acb05eb87554e";

const PROVIDER_URLS = {
  sepolia:
    "https://purple-frosty-orb.optimism-sepolia.quiknode.pro/aad424a10b06bf69795d7d8abd05b008f7d4c98c",
  optimism:
    "https://purple-frosty-orb.optimism-sepolia.quiknode.pro/aad424a10b06bf69795d7d8abd05b008f7d4c98c",
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
      // TODO: Save private key to secure store
      const privateKey = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.WALLET_PRIVATE_KEY
      );

      if (address && privateKey) {
        const network =
          process.env.EXPO_PUBLIC_NETWORK === "production"
            ? "optimism"
            : "sepolia";
        const walletInfo: WalletInfo = {
          address,
          network,
          schemaUID,
          providerUrl: PROVIDER_URLS[network],
          privateKey,
        };
        setWallet(walletInfo);
        setIsWalletCreated(true);

        // Initialize EAS helper
        const providerUrl = PROVIDER_URLS[network];
        setEasHelper(new EAS(providerUrl, privateKey, schema, schemaUID));
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
      const walletInfo: WalletInfo = {
        address,
        network,
        schemaUID,
        providerUrl: PROVIDER_URLS[network],
        privateKey,
      };
      console.log({ walletInfo });
      setWallet(walletInfo);
      setIsWalletCreated(true);

      // Initialize EAS helper
      const providerUrl = PROVIDER_URLS[network];
      setEasHelper(new EAS(providerUrl, privateKey, schema, schemaUID));

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
