import { EAS } from "eas-lib";
import { useState } from "react";

interface AccountKeys {
  mnemonic: string[];
  privateKey: string;
  address: string;
}

export function useCreateAccountKeys() {
  const [accountKeys, setAccountKeys] = useState<AccountKeys | null>(null);

  const generateKeys = () => {
    // Generate new mnemonic phrase
    const words = EAS.generateMnemonic();
    // Derive private key from mnemonic
    const privateKey = EAS.getPrivateKeyFromMnemonic(words);
    // Get public address from private key
    const address = EAS.getAddressFromPrivateKey(privateKey);

    setAccountKeys({
      mnemonic: words,
      privateKey,
      address,
    });
  };

  return {
    accountKeys,
    generateKeys,
  };
}
