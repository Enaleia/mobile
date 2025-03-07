import { polyfillWebCrypto } from "expo-standard-web-crypto";

// Ensure crypto is available before importing EAS ?
polyfillWebCrypto();

// Now import and re-export EAS
import { EAS } from "eas-lib";
export { EAS };
