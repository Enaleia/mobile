import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";
import { getEnvironment } from "@/utils/environment";
import { getNetworkConfig, getEASSchemaUID } from "@/utils/env";

type Environment = "development" | "production" | "preview";

type NetworkConfig = {
  providerUrl: string;
  scanUrl: string;
};

export const EAS_CONSTANTS = {
  SCHEMA:
    "string userID, string portOrCompanyName, string[] portOrCompanyCoordinates, string actionType, string actionDate, string[] actionCoordinates, string collectorName, string[] incomingMaterials, uint16[] incomingWeightsKg, string[] incomingCodes, string[] outgoingMaterials, uint16[] outgoingWeightsKg, string[] outgoingCodes, string productName, uint16 batchQuantity, string weightPerItemKg",
  SCHEMA_UID: getEASSchemaUID(),
  getNetworkConfig: (): NetworkConfig => {
    try {
      return getNetworkConfig();
    } catch (error) {
      console.error('[EAS] Error getting network config:', error);
      throw error;
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
