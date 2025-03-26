import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";

type Environment = "development" | "production" | "preview";

const getEnvironment = (): Environment => {
  const env = (process.env.NODE_ENV || "development") as string;
  if (env === "production") return "production";
  if (env === "preview") return "development"; // Treat preview same as development
  return "development";
};

export const EAS_CONSTANTS = {
  SCHEMA:
    "string userID, string portOrCompanyName, string[] portOrCompanyCoordinates, string actionType, string actionDate, string[] actionCoordinates, string collectorName, string[] incomingMaterials, uint16[] incomingWeightsKg, string[] incomingCodes, string[] outgoingMaterials, uint16[] outgoingWeightsKg, string[] outgoingCodes, string productName, uint16 batchQuantity, string weightPerItemKg",
  SCHEMA_UID: (() => {
    const normalizedEnv = getEnvironment();
    const schemaUid = process.env[`EXPO_PUBLIC_EAS_SCHEMA_UID_${normalizedEnv.toUpperCase()}`];
    if (!schemaUid) {
      throw new Error(`EAS Schema UID not found for environment: ${normalizedEnv}`);
    }
    return schemaUid;
  })(),
  getNetworkConfig: () => {
    try {
      const normalizedEnv = getEnvironment();
      const providerUrl = process.env[`EXPO_PUBLIC_NETWORK_PROVIDER_${normalizedEnv.toUpperCase()}`];
      const scanUrl = process.env[`EXPO_PUBLIC_NETWORK_SCAN_${normalizedEnv.toUpperCase()}`];
      
      if (!providerUrl) {
        throw new Error(`Network provider URL not found for environment: ${normalizedEnv}`);
      }
      if (!scanUrl) {
        throw new Error(`Network scan URL not found for environment: ${normalizedEnv}`);
      }
      
      return { providerUrl, scanUrl };
    } catch (error) {
      console.error('[EAS] Error getting network config:', error);
      // Fallback to development URLs if available
      const fallbackProviderUrl = process.env.EXPO_PUBLIC_NETWORK_PROVIDER_DEVELOPMENT;
      const fallbackScanUrl = process.env.EXPO_PUBLIC_NETWORK_SCAN_DEVELOPMENT;
      
      if (!fallbackProviderUrl || !fallbackScanUrl) {
        throw new Error('No network configuration available, even fallback values are missing');
      }
      
      return { 
        providerUrl: fallbackProviderUrl, 
        scanUrl: fallbackScanUrl 
      };
    }
  },
  MINIMUM_BALANCE: 0.0005,
  getAttestationUrl: (uid: string) => {
    const { scanUrl } = EAS_CONSTANTS.getNetworkConfig();
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
    
    const { providerUrl } = EAS_CONSTANTS.getNetworkConfig();
    
    this.eas = new EAS(
      providerUrl,
      privateKey,
      EAS_CONSTANTS.SCHEMA,
      EAS_CONSTANTS.SCHEMA_UID
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
      return { uid };
    } catch (error) {
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
