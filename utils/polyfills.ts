import { Buffer } from "buffer";
import { polyfillWebCrypto } from "expo-standard-web-crypto";

// Polyfill Web Crypto API
polyfillWebCrypto();

// Add Buffer to global scope
global.Buffer = Buffer;

// Verify crypto polyfill is loaded
console.log("Crypto available:", !!global.crypto?.getRandomValues);
