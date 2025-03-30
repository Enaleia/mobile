declare module '@env' {
  export const EXPO_PUBLIC_NETWORK_PROVIDER_DEVELOPMENT: string;
  export const EXPO_PUBLIC_NETWORK_PROVIDER_PRODUCTION: string;
  export const EXPO_PUBLIC_NETWORK_SCAN_DEVELOPMENT: string;
  export const EXPO_PUBLIC_NETWORK_SCAN_PRODUCTION: string;
  export const EXPO_PUBLIC_FUNDING_URL: string;
  export const EXPO_PUBLIC_EAS_SCHEMA_UID_DEVELOPMENT: string;
  export const EXPO_PUBLIC_EAS_SCHEMA_UID_PRODUCTION: string;
}

// Extend ProcessEnv
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_NETWORK_PROVIDER_DEVELOPMENT: string;
      EXPO_PUBLIC_NETWORK_PROVIDER_PRODUCTION: string;
      EXPO_PUBLIC_NETWORK_SCAN_DEVELOPMENT: string;
      EXPO_PUBLIC_NETWORK_SCAN_PRODUCTION: string;
      EXPO_PUBLIC_FUNDING_URL: string;
      EXPO_PUBLIC_EAS_SCHEMA_UID_DEVELOPMENT: string;
      EXPO_PUBLIC_EAS_SCHEMA_UID_PRODUCTION: string;
    }
  }
} 