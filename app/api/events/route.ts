import { CanonicalChangeEventSchema } from "@/domain/schemas";
import { demoCompany } from "@/demo/company";
import {
  loadIntegrationCredential,
  signatureHeadersFromRequest,
  SignedEventEnvelopeSchema,
  verifySignedIntake,
} from "@/domain/integration/signed-intake";
import {
  persistSignedIntake,
  recordSignedIntakeDisposition,
} from "@/db/signed-intake";
import { receiptHash } from "@/domain/crypto/receipts";

const affectedDomains = {
  LOCATION_ADDED: ["PROPERTY_ASSETS"],
  ASSET_VALUE_CHANGED: ["PROPERTY_ASSETS"],
  SUPPLIER_CONCENTRATION_CHANGED: ["SUPPLY_CHAIN", "BUSINESS_CONTINUITY"],
  CLOUD_DEPENDENCY_CHANGED: ["CYBER", "BUSINESS_CONTINUITY"],
  OPERATING_GEOGRAPHY_ADDED: ["BUSINESS_CONTINUITY"],
  ENDORSEMENT_RECEIVED: ["PROPERTY_ASSETS"],
} as const;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 65_536) {
    return Response.json(
      { error: "Request body is too large" },
      { status: 413 },
    );
  }
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 65_536) {
    return Response.json(
      { error: "Request body is too large" },
      { status: 413 },
    );
  }
  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  const signatureHeaders = signatureHeadersFromRequest(request.headers);
  const hasSignedHeader = [
    "x-product-key-id",
    "x-product-created-at",
    "x-product-expires-at",
    "x-product-nonce",
    "idempotency-key",
    "content-digest",
    "x-product-signature",
  ].some((header) => request.headers.has(header));

  if (hasSignedHeader) {
    if (!signatureHeaders.success) {
      return Response.json(
        { error: "Signed intake headers are incomplete or invalid" },
        { status: 401 },
      );
    }
    const credential = loadIntegrationCredential(signatureHeaders.data.keyId);
    if (!credential) {
      return Response.json(
        { error: "Integration credential is invalid" },
        { status: 401 },
      );
    }
    const envelope = SignedEventEnvelopeSchema.safeParse(input);
    if (!envelope.success) {
      await recordSignedIntakeDisposition({
        organizationId: credential.organizationId,
        keyId: credential.keyId,
        eventType: "CANONICAL_EVENT_REJECTED",
        summary:
          "Signed canonical event used an invalid or unsupported schema.",
        receiptHash: receiptHash({
          keyId: credential.keyId,
          reason: "INVALID_OR_UNSUPPORTED_SCHEMA",
          contentDigest: signatureHeaders.data.contentDigest,
        }),
      });
      return Response.json(
        {
          error: "Signed event envelope validation failed",
          issues: envelope.error.issues,
        },
        { status: 422 },
      );
    }
    const verification = verifySignedIntake({
      rawBody,
      target: "/api/events",
      envelope: envelope.data,
      headers: signatureHeaders.data,
      credential,
      now: new Date(),
    });
    if (!verification.ok) {
      await recordSignedIntakeDisposition({
        organizationId: credential.organizationId,
        keyId: credential.keyId,
        eventType: "CANONICAL_EVENT_REJECTED",
        summary: `Signed canonical event was rejected: ${verification.reason}.`,
        receiptHash: receiptHash({
          keyId: credential.keyId,
          reason: verification.reason,
          contentDigest: signatureHeaders.data.contentDigest,
          nonce: signatureHeaders.data.nonce,
        }),
        correlationId: envelope.data.correlationId,
      });
      return Response.json(
        {
          error: "Signed event verification failed",
          reason: verification.reason,
        },
        { status: verification.reason === "TENANT_MISMATCH" ? 403 : 401 },
      );
    }
    let persisted;
    try {
      persisted = await persistSignedIntake({
        envelope: envelope.data,
        headers: signatureHeaders.data,
        credential,
        receiptHash: verification.receiptHash,
      });
    } catch {
      return Response.json(
        { error: "Durable signed intake failed closed" },
        { status: 503 },
      );
    }
    if (!persisted) {
      return Response.json(
        { error: "Durable signed intake is unavailable" },
        { status: 503 },
      );
    }
    if (persisted.outcome === "NONCE_REUSED") {
      await recordSignedIntakeDisposition({
        organizationId: credential.organizationId,
        keyId: credential.keyId,
        eventType: "CANONICAL_EVENT_REPLAY_REJECTED",
        summary: "Signed canonical event reused a nonce.",
        receiptHash: verification.receiptHash,
        correlationId: envelope.data.correlationId,
      });
      return Response.json(
        { error: "Nonce has already been used" },
        { status: 409 },
      );
    }
    if (persisted.outcome === "RATE_LIMITED") {
      return Response.json(
        { error: "Tenant intake limit exceeded" },
        { status: 429 },
      );
    }
    if (persisted.outcome === "DUPLICATE") {
      await recordSignedIntakeDisposition({
        organizationId: credential.organizationId,
        keyId: credential.keyId,
        eventType: "CANONICAL_EVENT_DUPLICATE",
        summary: "Duplicate canonical event returned its original receipt.",
        receiptHash: persisted.receiptHash,
        correlationId: envelope.data.correlationId,
      });
    }
    return Response.json(
      {
        accepted: true,
        persisted: true,
        duplicate: persisted.outcome === "DUPLICATE",
        eventRecordId: persisted.eventRecordId,
        jobId: persisted.jobId,
        receiptHash: persisted.receiptHash,
      },
      {
        status: persisted.outcome === "ACCEPTED" ? 202 : 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const result = CanonicalChangeEventSchema.safeParse(input);
  if (!result.success) {
    return Response.json(
      {
        error: "Canonical event validation failed",
        issues: result.error.issues,
      },
      { status: 422 },
    );
  }
  if (result.data.organizationId !== demoCompany.id) {
    return Response.json(
      { error: "Unknown synthetic demo tenant" },
      { status: 404 },
    );
  }
  return Response.json({
    accepted: true,
    persisted: false,
    demoMode: true,
    message:
      "Event validated. The public demo endpoint returns a preview and does not persist external input.",
    normalizedEvent: {
      ...result.data,
      id: result.data.id ?? `preview_${result.data.eventType.toLowerCase()}`,
    },
    affectedDomains: affectedDomains[result.data.eventType],
  });
}
