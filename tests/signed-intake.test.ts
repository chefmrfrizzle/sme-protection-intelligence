import { describe, expect, it } from "vitest";
import {
  SignedEventEnvelopeSchema,
  signIntakeRequest,
  verifySignedIntake,
  type IntegrationCredential,
  type SignedEventEnvelope,
} from "@/domain/integration/signed-intake";

const now = new Date("2026-08-13T14:00:00.000Z");
const secret = "test-only-secret-with-at-least-32-characters";
const envelope: SignedEventEnvelope = {
  schemaVersion: "protection-change-event/1.0",
  eventId: "asset-system:evt-1",
  organizationId: "org_pacific_components",
  sourceSystem: { id: "asset-system", type: "API", environment: "TEST" },
  eventType: "LOCATION_ADDED",
  occurredAt: "2026-08-13T13:58:00.000Z",
  observedAt: "2026-08-13T13:59:00.000Z",
  correlationId: "corr-1",
  causationId: null,
  idempotencyKey: "org:asset-system:evt-1",
  payload: { locationId: "loc_b", country: "CA" },
  evidenceReferences: ["evidence-version:lease-b:1"],
  synthetic: true,
};
const rawBody = JSON.stringify(envelope);
const credential: IntegrationCredential = {
  keyId: "key-1",
  organizationId: envelope.organizationId,
  secret,
  enabled: true,
  maxRequestsPerMinute: 60,
};

function signedHeaders(
  overrides: Partial<{
    createdAt: string;
    expiresAt: string;
    nonce: string;
    idempotencyKey: string;
  }> = {},
) {
  return signIntakeRequest(
    rawBody,
    "/api/events",
    {
      keyId: credential.keyId,
      createdAt: overrides.createdAt ?? "2026-08-13T13:59:00.000Z",
      expiresAt: overrides.expiresAt ?? "2026-08-13T14:03:00.000Z",
      nonce: overrides.nonce ?? "nonce-000000000001",
      idempotencyKey: overrides.idempotencyKey ?? envelope.idempotencyKey,
    },
    envelope.organizationId,
    secret,
  );
}

describe("signed canonical intake", () => {
  it("accepts an intact, fresh, tenant-matched request", () => {
    const result = verifySignedIntake({
      rawBody,
      target: "/api/events",
      envelope,
      headers: signedHeaders(),
      credential,
      now,
    });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.receiptHash).toMatch(/^sha256-[a-f0-9]{64}$/);
  });

  it("rejects a body changed after signing", () => {
    const result = verifySignedIntake({
      rawBody: rawBody.replace("loc_b", "loc_attacker"),
      target: "/api/events",
      envelope,
      headers: signedHeaders(),
      credential,
      now,
    });
    expect(result).toEqual({ ok: false, reason: "BODY_DIGEST_MISMATCH" });
  });

  it("rejects expired and over-long signature windows", () => {
    const expired = signedHeaders({ expiresAt: "2026-08-13T13:59:59.000Z" });
    expect(
      verifySignedIntake({
        rawBody,
        target: "/api/events",
        envelope,
        headers: expired,
        credential,
        now,
      }),
    ).toEqual({ ok: false, reason: "SIGNATURE_EXPIRED" });

    const tooLong = signedHeaders({ expiresAt: "2026-08-13T14:10:00.000Z" });
    expect(
      verifySignedIntake({
        rawBody,
        target: "/api/events",
        envelope,
        headers: tooLong,
        credential,
        now,
      }),
    ).toEqual({ ok: false, reason: "SIGNATURE_WINDOW_TOO_LARGE" });
  });

  it("rejects tenant and idempotency substitution", () => {
    expect(
      verifySignedIntake({
        rawBody,
        target: "/api/events",
        envelope,
        headers: signedHeaders(),
        credential: { ...credential, organizationId: "org_other" },
        now,
      }),
    ).toEqual({ ok: false, reason: "TENANT_MISMATCH" });

    const mismatched = signedHeaders({ idempotencyKey: "different-key" });
    expect(
      verifySignedIntake({
        rawBody,
        target: "/api/events",
        envelope,
        headers: mismatched,
        credential,
        now,
      }),
    ).toEqual({ ok: false, reason: "IDEMPOTENCY_MISMATCH" });
  });

  it("supports a single previous secret during rotation", () => {
    const headers = signIntakeRequest(
      rawBody,
      "/api/events",
      {
        keyId: credential.keyId,
        createdAt: "2026-08-13T13:59:00.000Z",
        expiresAt: "2026-08-13T14:03:00.000Z",
        nonce: "nonce-rotation-0001",
        idempotencyKey: envelope.idempotencyKey,
      },
      envelope.organizationId,
      "previous-secret-with-at-least-32-characters",
    );
    expect(
      verifySignedIntake({
        rawBody,
        target: "/api/events",
        envelope,
        headers,
        credential: {
          ...credential,
          previousSecret: "previous-secret-with-at-least-32-characters",
        },
        now,
      }),
    ).toMatchObject({ ok: true });
  });

  it("rejects unsupported schemas before signature processing", () => {
    expect(
      SignedEventEnvelopeSchema.safeParse({
        ...envelope,
        schemaVersion: "protection-change-event/2.0",
      }).success,
    ).toBe(false);
  });
});
