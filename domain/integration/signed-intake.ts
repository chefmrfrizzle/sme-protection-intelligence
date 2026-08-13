import { z } from "zod";
import {
  constantTimeHexEqual,
  hmacSha256Hex,
  receiptHash,
  sha256Base64,
} from "@/domain/crypto/receipts";

export const SignedEventEnvelopeSchema = z.object({
  schemaVersion: z.literal("protection-change-event/1.0"),
  eventId: z.string().min(1).max(160),
  organizationId: z.string().min(1).max(120),
  sourceSystem: z.object({
    id: z.string().min(1).max(120),
    type: z.enum(["API", "BATCH", "MANUAL"]),
    environment: z.enum(["TEST", "PRODUCTION"]),
  }),
  eventType: z.enum([
    "LOCATION_ADDED",
    "ASSET_VALUE_CHANGED",
    "SUPPLIER_CONCENTRATION_CHANGED",
    "CLOUD_DEPENDENCY_CHANGED",
    "OPERATING_GEOGRAPHY_ADDED",
    "ENDORSEMENT_RECEIVED",
  ]),
  occurredAt: z.string().datetime(),
  observedAt: z.string().datetime(),
  correlationId: z.string().min(1).max(160),
  causationId: z.string().min(1).max(160).nullable(),
  idempotencyKey: z.string().min(8).max(200),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  evidenceReferences: z.array(z.string().min(1)).max(100).default([]),
  synthetic: z.boolean(),
});

export const IntakeSignatureHeadersSchema = z.object({
  keyId: z.string().min(1).max(160),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  nonce: z.string().min(16).max(200),
  idempotencyKey: z.string().min(8).max(200),
  contentDigest: z.string().regex(/^sha-256=:[A-Za-z0-9+/]+={0,2}:$/),
  signature: z.string().regex(/^sha256=[a-f0-9]{64}$/i),
});

export type SignedEventEnvelope = z.infer<typeof SignedEventEnvelopeSchema>;
export type IntakeSignatureHeaders = z.infer<
  typeof IntakeSignatureHeadersSchema
>;

export type IntegrationCredential = {
  keyId: string;
  organizationId: string;
  secret: string;
  previousSecret?: string;
  enabled: boolean;
  maxRequestsPerMinute: number;
};

export type SignatureFailure =
  | "BODY_DIGEST_MISMATCH"
  | "SIGNATURE_INVALID"
  | "SIGNATURE_EXPIRED"
  | "SIGNATURE_NOT_YET_VALID"
  | "SIGNATURE_WINDOW_TOO_LARGE"
  | "TENANT_MISMATCH"
  | "IDEMPOTENCY_MISMATCH"
  | "CREDENTIAL_DISABLED";

const maximumSignatureWindowMs = 5 * 60 * 1_000;
const maximumFutureSkewMs = 60 * 1_000;

export function contentDigest(rawBody: string) {
  return `sha-256=:${sha256Base64(rawBody)}:`;
}

export function canonicalSigningInput(
  method: string,
  target: string,
  headers: Omit<IntakeSignatureHeaders, "signature">,
  organizationId: string,
) {
  return [
    method.toUpperCase(),
    target,
    `content-digest:${headers.contentDigest}`,
    `organization-id:${organizationId}`,
    `key-id:${headers.keyId}`,
    `created-at:${headers.createdAt}`,
    `expires-at:${headers.expiresAt}`,
    `nonce:${headers.nonce}`,
    `idempotency-key:${headers.idempotencyKey}`,
  ].join("\n");
}

export function signIntakeRequest(
  rawBody: string,
  target: string,
  unsignedHeaders: Omit<IntakeSignatureHeaders, "contentDigest" | "signature">,
  organizationId: string,
  secret: string,
): IntakeSignatureHeaders {
  const headers = {
    ...unsignedHeaders,
    contentDigest: contentDigest(rawBody),
  };
  return {
    ...headers,
    signature: `sha256=${hmacSha256Hex(
      secret,
      canonicalSigningInput("POST", target, headers, organizationId),
    )}`,
  };
}

export function verifySignedIntake(input: {
  rawBody: string;
  target: string;
  envelope: SignedEventEnvelope;
  headers: IntakeSignatureHeaders;
  credential: IntegrationCredential;
  now: Date;
}):
  | { ok: true; receiptHash: string }
  | { ok: false; reason: SignatureFailure } {
  const { rawBody, target, envelope, headers, credential, now } = input;
  if (!credential.enabled) return { ok: false, reason: "CREDENTIAL_DISABLED" };
  if (credential.organizationId !== envelope.organizationId)
    return { ok: false, reason: "TENANT_MISMATCH" };
  if (headers.idempotencyKey !== envelope.idempotencyKey)
    return { ok: false, reason: "IDEMPOTENCY_MISMATCH" };
  if (headers.contentDigest !== contentDigest(rawBody))
    return { ok: false, reason: "BODY_DIGEST_MISMATCH" };

  const createdAt = Date.parse(headers.createdAt);
  const expiresAt = Date.parse(headers.expiresAt);
  const nowMs = now.getTime();
  if (createdAt > nowMs + maximumFutureSkewMs)
    return { ok: false, reason: "SIGNATURE_NOT_YET_VALID" };
  if (expiresAt <= nowMs) return { ok: false, reason: "SIGNATURE_EXPIRED" };
  if (
    expiresAt <= createdAt ||
    expiresAt - createdAt > maximumSignatureWindowMs
  )
    return { ok: false, reason: "SIGNATURE_WINDOW_TOO_LARGE" };

  const signingInput = canonicalSigningInput(
    "POST",
    target,
    headers,
    envelope.organizationId,
  );
  const supplied = headers.signature.slice("sha256=".length);
  const secrets = [credential.secret, credential.previousSecret].filter(
    (value): value is string => Boolean(value),
  );
  if (
    !secrets.some((secret) =>
      constantTimeHexEqual(hmacSha256Hex(secret, signingInput), supplied),
    )
  ) {
    return { ok: false, reason: "SIGNATURE_INVALID" };
  }

  return {
    ok: true,
    receiptHash: receiptHash({
      envelope,
      keyId: headers.keyId,
      createdAt: headers.createdAt,
      expiresAt: headers.expiresAt,
      nonce: headers.nonce,
      contentDigest: headers.contentDigest,
    }),
  };
}

const CredentialConfigSchema = z.record(
  z.string(),
  z.object({
    organizationId: z.string().min(1),
    secret: z.string().min(32),
    previousSecret: z.string().min(32).optional(),
    enabled: z.boolean().default(true),
    maxRequestsPerMinute: z.number().int().positive().max(10_000).default(60),
  }),
);

export function loadIntegrationCredential(keyId: string) {
  const raw = process.env.INTEGRATION_HMAC_CREDENTIALS_JSON;
  if (!raw) return null;
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = CredentialConfigSchema.safeParse(input);
  if (!parsed.success || !parsed.data[keyId]) return null;
  return { keyId, ...parsed.data[keyId] } satisfies IntegrationCredential;
}

export function signatureHeadersFromRequest(headers: Headers) {
  return IntakeSignatureHeadersSchema.safeParse({
    keyId: headers.get("x-product-key-id"),
    createdAt: headers.get("x-product-created-at"),
    expiresAt: headers.get("x-product-expires-at"),
    nonce: headers.get("x-product-nonce"),
    idempotencyKey: headers.get("idempotency-key"),
    contentDigest: headers.get("content-digest"),
    signature: headers.get("x-product-signature"),
  });
}
