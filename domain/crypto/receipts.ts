import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { stableStringify } from "@/domain/reconciliation/hash";

export function sha256Hex(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Base64(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("base64");
}

export function receiptHash(value: unknown) {
  return `sha256-${sha256Hex(stableStringify(value))}`;
}

export function hmacSha256Hex(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function constantTimeHexEqual(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const leftBytes = Buffer.from(left, "hex");
  const rightBytes = Buffer.from(right, "hex");
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}
