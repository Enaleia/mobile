import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";

export const EAS_CONSTANTS = {
  SCHEMA: "uint256 eventId, string[] weights, string comment",
  SCHEMA_UID:
    "0x2562d7a15eee78cb9e1dc60ad1c7feaa300b59f58ed1ac37b5ebadd24d507fd7",
  PROVIDER_URLS: {
    sepolia:
      "https://purple-frosty-orb.optimism-sepolia.quiknode.pro/aad424a10b06bf69795d7d8abd05b008f7d4c98c",
    optimism:
      "https://purple-frosty-orb.optimism-sepolia.quiknode.pro/aad424a10b06bf69795d7d8abd05b008f7d4c98c",
  },
};

export class EASAttestationError extends Error {
  constructor(message: string, public readonly schema?: EnaleiaEASSchema) {
    super(message);
    this.name = "EASAttestationError";
  }
}

export class EASService {
  private eas: EAS | null = null;

  constructor(providerUrl: string, privateKey: string) {
    if (!providerUrl || !privateKey) {
      throw new EASAttestationError("Missing wallet credentials");
    }
    this.eas = new EAS(
      providerUrl,
      privateKey,
      EAS_CONSTANTS.SCHEMA,
      EAS_CONSTANTS.SCHEMA_UID
    );
  }

  private formatAttestationData(schema: EnaleiaEASSchema) {
    return {
      eventId: Date.now(),
      weights: [
        // User and company info
        schema.userID,
        schema.portOrCompanyName,
        ...schema.portOrCompanyCoordinates.map(String),

        // Action info
        schema.actionType,
        schema.actionDate,
        ...schema.actionCoordinates.map(String),
        schema.collectorName,

        // Incoming materials
        ...schema.incomingMaterials,
        ...schema.incomingWeightsKg.map(String),
        ...schema.incomingCodes,

        // Outgoing materials
        ...schema.outgoingMaterials,
        ...schema.outgoingWeightsKg.map(String),
        ...schema.outgoingCodes,

        // Product info
        schema.productName,
        schema.batchQuantity.toString(),
        schema.weightPerItemKg.toString(),
      ].filter(Boolean),
      comment: `${schema.actionType} at ${schema.portOrCompanyName} - ${schema.actionDate}`,
    };
  }

  async attest(schema: EnaleiaEASSchema): Promise<string> {
    if (!this.eas) {
      throw new EASAttestationError("EAS not initialized");
    }

    try {
      const attestationData = this.formatAttestationData(schema);
      const uid = await this.eas.attest(attestationData);

      if (!uid) {
        throw new EASAttestationError("No transaction hash returned", schema);
      }

      return uid;
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

  async batchAttest(
    schemas: EnaleiaEASSchema[]
  ): Promise<Array<{ schema: EnaleiaEASSchema; result: string | Error }>> {
    return Promise.all(
      schemas.map(async (schema) => {
        try {
          const result = await this.attest(schema);
          return { schema, result };
        } catch (error) {
          return {
            schema,
            result: error instanceof Error ? error : new Error("Unknown error"),
          };
        }
      })
    );
  }

  // Add verification method for future use
  async verify(uid: string): Promise<boolean> {
    // TODO: Implement verification logic
    return true;
  }
}
