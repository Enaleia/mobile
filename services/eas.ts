import { EAS } from "eas-lib";
import { useWallet } from "@/contexts/WalletContext";

// Constants for EAS
export const EAS_CONSTANTS = {
  SCHEMA: "uint256 eventId, string[] weights, string comment",
  SCHEMA_UID:
    "0x6123441ae23c2a9ef6c0dfa07ac6ad5bb9a7950c4759e4b5989acb05eb87554e",
};

export interface AttestationBody {
  eventId: number;
  weights: string[];
  comment: string;
}

export class EASService {
  private eas: EAS | null = null;

  constructor(providerUrl: string, privateKey: string) {
    this.eas = new EAS(
      providerUrl,
      privateKey,
      EAS_CONSTANTS.SCHEMA,
      EAS_CONSTANTS.SCHEMA_UID
    );
  }

  async attest(body: AttestationBody): Promise<string> {
    if (!this.eas) {
      throw new Error("EAS not initialized");
    }

    try {
      console.log("Starting attestation:", body);
      const uid = await this.eas.attest(body);
      console.log("Attestation successful:", uid);
      return uid;
    } catch (error) {
      console.error("Attestation failed:", error);
      throw error;
    }
  }

  // Add verification method for future use
  async verify(uid: string): Promise<boolean> {
    // TODO: Implement verification logic
    return true;
  }
}

// Helper to create attestation body from queue item
export function createAttestationBody(
  actionId: number,
  actionName: string
): AttestationBody {
  return {
    eventId: actionId,
    weights: [], // Empty for now as per requirements
    comment: actionName,
  };
}
