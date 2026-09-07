import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function demoHash(value: unknown): string {
  // Synchronous in both React rendering and server reconciliation. The input
  // encoding matches the server's node:crypto receiptHash implementation.
  const input = new TextEncoder().encode(stableStringify(value));
  return `sha256-${bytesToHex(sha256(input))}`;
}
