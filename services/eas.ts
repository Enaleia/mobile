import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";

type Environment = "development" | "production" | "preview";

export const EAS_CONSTANTS = {
  SCHEMA:
    "string userID, string portOrCompanyName, string[] portOrCompanyCoordinates, string actionType, string actionDate, string[] actionCoordinates, string collectorName, string[] incomingMaterials, uint16[] incomingWeightsKg, string[] incomingCodes, string[] outgoingMaterials, uint16[] outgoingWeightsKg, string[] outgoingCodes, string productName, uint16 batchQuantity, string weightPerItemKg",
  SCHEMA_UID: (() => {
    const env = (process.env.NODE_ENV || "development") as Environment;
    const normalizedEnv = env === "preview" ? "development" : env;
    const schemaUid = process.env[`EXPO_PUBLIC_EAS_SCHEMA_UID_${normalizedEnv.toUpperCase()}`];
    if (!schemaUid) {
      throw new Error(`EAS Schema UID not found for environment: ${normalizedEnv}`);
    }
    return schemaUid;
  })(),
  PROVIDER_URLS: {
    sepolia: process.env.EXPO_PUBLIC_EAS_SEPOLIA_PROVIDER_URL,
    optimism: process.env.EXPO_PUBLIC_EAS_OPTIMISM_PROVIDER_URL,
  },
  SCAN_URLS: {
    sepolia: process.env.EXPO_PUBLIC_EAS_SCAN_URL_SEPOLIA,
    optimism: process.env.EXPO_PUBLIC_EAS_SCAN_URL_OPTIMISM,
  },
  MINIMUM_BALANCE: 0.0005,
  getNetworkFromProviderUrl: (url: string): "sepolia" | "optimism" => {
    return (
      (Object.entries(EAS_CONSTANTS.PROVIDER_URLS).find(
        ([_, providerUrl]) => providerUrl === url
      )?.[0] as "sepolia" | "optimism") || "sepolia"
    );
  },
  getAttestationUrl: (
    uid: string,
    network: "sepolia" | "optimism" = "sepolia"
  ) => `${EAS_CONSTANTS.SCAN_URLS[network]}/attestation/view/${uid}`,
};

export type EASAttestationResult = {
  uid: string;
  network: "sepolia" | "optimism";
};

export class EASAttestationError extends Error {
  constructor(message: string, public readonly schema?: EnaleiaEASSchema) {
    super(message);
    this.name = "EASAttestationError";
  }
}

export class EASService {
  private eas: EAS | null = null;
  private network: "sepolia" | "optimism";

  constructor(providerUrl: string, privateKey: string) {
    if (!providerUrl || !privateKey) {
      throw new EASAttestationError("Missing wallet credentials");
    }
    this.network = EAS_CONSTANTS.getNetworkFromProviderUrl(providerUrl);
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
      console.log("Attestation successful", uid);
      return { uid, network: this.network };
    } catch (error) {
      if (error instanceof EASAttestationError) {
        throw error;
      }
      console.error("Attestation failed", error);
      throw new EASAttestationError(
        `Attestation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        schema
      );
    }
  }
}
