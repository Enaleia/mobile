import { EAS } from "eas-lib";

export interface WalletInfo {
  address: string;
  network: "optimism" | "sepolia";
  schemaUID?: string;
}

export interface WalletContextType {
  wallet: WalletInfo | null;
  createWallet: () => Promise<WalletInfo>;
  isWalletCreated: boolean;
  easHelper: EAS | null;
}
