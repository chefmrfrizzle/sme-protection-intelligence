import { z } from "zod";
import { receiptHash, sha256Hex } from "@/domain/crypto/receipts";

export const EvidenceLifecycleStateSchema = z.enum([
  "QUARANTINED",
  "REJECTED_TYPE_MISMATCH",
  "REJECTED_OVERSIZE",
  "REJECTED_MALWARE",
  "APPROVED_FOR_PROCESSING",
  "ERASURE_REQUESTED",
  "CONTENT_ERASED",
]);

export type EvidenceLifecycleState = z.infer<
  typeof EvidenceLifecycleStateSchema
>;

export type EvidenceValidation = {
  state: EvidenceLifecycleState;
  detectedMime: "application/pdf" | "text/plain" | "text/csv" | "unknown";
  sha256: string;
  sizeBytes: number;
  reason?: string;
};

export type MalwareScanner = {
  id: string;
  scan(bytes: Uint8Array): Promise<{
    disposition: "CLEAN" | "MALICIOUS" | "ERROR";
    signature?: string;
  }>;
};

const allowedMimeTypes = new Set(["application/pdf", "text/plain", "text/csv"]);

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectMime(bytes: Uint8Array) {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return "application/pdf" as const;
  if (!bytes.includes(0)) return "text/plain" as const;
  return "unknown" as const;
}

export function validateEvidenceContent(input: {
  bytes: Uint8Array;
  declaredMime: string;
  maxBytes?: number;
}): EvidenceValidation {
  const maxBytes = input.maxBytes ?? 10 * 1024 * 1024;
  const sha256 = `sha256-${sha256Hex(input.bytes)}`;
  if (input.bytes.byteLength > maxBytes) {
    return {
      state: "REJECTED_OVERSIZE",
      detectedMime: "unknown",
      sha256,
      sizeBytes: input.bytes.byteLength,
      reason: "Evidence exceeds the configured size limit.",
    };
  }
  const detected = detectMime(input.bytes);
  const declared =
    input.declaredMime === "text/csv" && detected === "text/plain"
      ? "text/csv"
      : detected;
  if (
    !allowedMimeTypes.has(input.declaredMime) ||
    declared !== input.declaredMime
  ) {
    return {
      state: "REJECTED_TYPE_MISMATCH",
      detectedMime: declared,
      sha256,
      sizeBytes: input.bytes.byteLength,
      reason: "Declared MIME type does not match the file signature.",
    };
  }
  return {
    state: "QUARANTINED",
    detectedMime: declared,
    sha256,
    sizeBytes: input.bytes.byteLength,
  };
}

export const deterministicSyntheticScanner: MalwareScanner = {
  id: "deterministic-synthetic-scanner/1.0",
  async scan(bytes) {
    const text = new TextDecoder().decode(bytes);
    if (text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
      return { disposition: "MALICIOUS", signature: "EICAR_TEST_SIGNATURE" };
    }
    return { disposition: "CLEAN" };
  },
};

export async function quarantineAndScan(input: {
  bytes: Uint8Array;
  declaredMime: string;
  scanner: MalwareScanner;
  maxBytes?: number;
}) {
  const validation = validateEvidenceContent(input);
  if (validation.state !== "QUARANTINED") return validation;
  const scan = await input.scanner.scan(input.bytes);
  if (scan.disposition === "MALICIOUS") {
    return {
      ...validation,
      state: "REJECTED_MALWARE" as const,
      reason: `Scanner rejected content (${scan.signature ?? "MALICIOUS"}).`,
    };
  }
  if (scan.disposition === "ERROR") {
    return {
      ...validation,
      state: "QUARANTINED" as const,
      reason: "Scanner did not produce a clean disposition.",
    };
  }
  return { ...validation, state: "APPROVED_FOR_PROCESSING" as const };
}

export function erasureDecision(input: {
  legalHold: boolean;
  retentionUntil?: string;
  now: Date;
}) {
  if (input.legalHold) return { allowed: false as const, reason: "LEGAL_HOLD" };
  if (
    input.retentionUntil &&
    Date.parse(input.retentionUntil) > input.now.getTime()
  ) {
    return { allowed: false as const, reason: "RETENTION_ACTIVE" };
  }
  return {
    allowed: true as const,
    tombstoneReceipt: receiptHash({
      legalHold: input.legalHold,
      retentionUntil: input.retentionUntil,
      erasedAt: input.now.toISOString(),
    }),
  };
}
