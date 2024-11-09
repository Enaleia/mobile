declare module "eas-lib" {
  export class EAS {
    static generateMnemonic(): string[];
    static getPrivateKeyFromMnemonic(mnemonic: string[]): string;
    static getAddressFromPrivateKey(privateKey: string): string;
  }
}
