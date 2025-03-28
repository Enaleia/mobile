import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";

type Environment = "development" | "production";

interface NetworkConfig {
  providerUrl: string;
  scanUrl: string;
}

interface EASConfig {
  schemaUid: string;
  network: NetworkConfig;
}

// Environment-specific configurations
const ENV_CONFIG: Record<Environment, EASConfig> = {
  development: {
    schemaUid: process.env.EXPO_PUBLIC_EAS_SCHEMA_UID_DEVELOPMENT || '',
    network: {
      providerUrl: process.env.EXPO_PUBLIC_NETWORK_PROVIDER_DEVELOPMENT || '',
      scanUrl: process.env.EXPO_PUBLIC_NETWORK_SCAN_DEVELOPMENT || '',
    },
  },
  production: {
    schemaUid: process.env.EXPO_PUBLIC_EAS_SCHEMA_UID_PRODUCTION || '',
    network: {
      providerUrl: process.env.EXPO_PUBLIC_NETWORK_PROVIDER_PRODUCTION || '',
      scanUrl: process.env.EXPO_PUBLIC_NETWORK_SCAN_PRODUCTION || '',
    },
  },
};

const getEnvironment = (): Environment => {
  return process.env.NODE_ENV === "production" ? "production" : "development";
};

const validateConfig = (config: EASConfig, env: Environment): void => {
  if (!config.schemaUid) {
    throw new Error(`Missing EAS schema UID for environment: ${env}`);
  }
  if (!config.network.providerUrl) {
    throw new Error(`Missing network provider URL for environment: ${env}`);
  }
  if (!config.network.scanUrl) {
    throw new Error(`Missing network scan URL for environment: ${env}`);
  }
};

const getCurrentConfig = (): EASConfig => {
  const env = getEnvironment();
  const config = ENV_CONFIG[env];
  validateConfig(config, env);
  return config;
};

export const EAS_CONSTANTS = {
  SCHEMA:
    "string userID, string portOrCompanyName, string[] portOrCompanyCoordinates, string actionType, string actionDate, string[] actionCoordinates, string collectorName, string[] incomingMaterials, uint16[] incomingWeightsKg, string[] incomingCodes, string[] outgoingMaterials, uint16[] outgoingWeightsKg, string[] outgoingCodes, string productName, uint16 batchQuantity, string weightPerItemKg",
  
  SCHEMA_UID: getCurrentConfig().schemaUid,
  
  getNetworkConfig: (): NetworkConfig => getCurrentConfig().network,
  
  MINIMUM_BALANCE: 0.0005,

  getAttestationUrl: (uid: string): string => {
    const { scanUrl } = getCurrentConfig().network;
    return `${scanUrl}/attestation/view/${uid}`;
  },
};

export type EASAttestationResult = {
  uid: string;
};

export class EASAttestationError extends Error {
  constructor(message: string, public readonly schema?: EnaleiaEASSchema) {
    super(message);
    this.name = "EASAttestationError";
  }
}

export class EASService {
  private eas: EAS | null = null;

  constructor(privateKey: string) {
    if (!privateKey) {
      throw new EASAttestationError("Missing wallet credentials");
    }
    
    const config = getCurrentConfig();
    
    this.eas = new EAS(
      config.network.providerUrl,
      privateKey,
      EAS_CONSTANTS.SCHEMA,
      config.schemaUid
    );
  }

  async attest(schema: EnaleiaEASSchema): Promise<EASAttestationResult> {
    if (!this.eas) {
      throw new EASAttestationError("EAS not initialized");
    }

    try {
      const uid = await this.eas.attest(schema);

      if (!uid) {
        throw new EASAttestationError("No transaction hash returned", schema);
      }
      
      console.log(`[EAS] Attestation successful: ${uid}`);
      return { uid };
    } catch (error) {
      console.error("[EAS] Attestation failed:", error);
      if (error instanceof EASAttestationError) {
        throw error;
      }
      throw new EASAttestationError(
        `Attestation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        schema
      );
    }
  }
}
