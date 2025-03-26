import { EAS } from "eas-lib";

export interface WalletInfo {
  address: string;
  providerUrl: string;
  privateKey: string;
  schemaUID?: string;
}

export interface WalletContextType {
  wallet: WalletInfo | null;
  createWallet: () => Promise<WalletInfo>;
  isWalletCreated: boolean;
  easHelper: EAS | null;
  verifyWalletOwnership: (address: string) => Promise<boolean>;
}
