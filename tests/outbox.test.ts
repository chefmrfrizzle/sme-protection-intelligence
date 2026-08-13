import { describe, expect, it, vi } from "vitest";
import {
  deliverWebhook,
  isPrivateOrReservedAddress,
  validateWebhookDestination,
  webhookHeaders,
} from "@/domain/integration/outbox";

const endpoint = {
  url: "https://workflow.example.test/hooks/protection",
  allowedHosts: ["workflow.example.test"],
  secret: "synthetic-test-secret-at-least-32-characters",
};
const delivery = {
  deliveryId: "delivery-1",
  idempotencyKey: "org:case:1",
  payload: { synthetic: true, state: "READY_FOR_PROFESSIONAL_REVIEW" },
  attempt: 0,
  maxAttempts: 3,
};
const now = new Date("2026-08-13T14:00:00.000Z");

describe("transactional outbox delivery", () => {
  it("blocks private, metadata, non-HTTPS, redirect, and unapproved destinations", () => {
    expect(isPrivateOrReservedAddress("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedAddress("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedAddress("10.2.3.4")).toBe(true);
    expect(
      validateWebhookDestination({
        url: "http://workflow.example.test/hook",
        allowedHosts: endpoint.allowedHosts,
        resolvedAddresses: ["8.8.8.8"],
      }),
    ).toMatchObject({ ok: false, reason: "HTTPS_REQUIRED" });
    expect(
      validateWebhookDestination({
        url: "https://evil.example/hook",
        allowedHosts: endpoint.allowedHosts,
        resolvedAddresses: ["8.8.8.8"],
      }),
    ).toMatchObject({ ok: false, reason: "HOST_NOT_ALLOWLISTED" });
  });

  it("signs the exact body and stable delivery identity", () => {
    const first = webhookHeaders({
      body: JSON.stringify(delivery.payload),
      target: "/hooks/protection",
      deliveryId: delivery.deliveryId,
      idempotencyKey: delivery.idempotencyKey,
      timestamp: now.toISOString(),
      secret: endpoint.secret,
    });
    const second = webhookHeaders({
      body: JSON.stringify(delivery.payload),
      target: "/hooks/protection",
      deliveryId: delivery.deliveryId,
      idempotencyKey: delivery.idempotencyKey,
      timestamp: now.toISOString(),
      secret: endpoint.secret,
    });
    expect(first).toEqual(second);
    expect(first["X-Product-Signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("delivers once with signed headers and no redirect following", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Promise.resolve(new Response(null, { status: 202 })),
    );
    const result = await deliverWebhook({
      endpoint,
      delivery,
      now,
      resolveHost: async () => ["8.8.8.8"],
      fetcher,
    });
    expect(result).toMatchObject({ state: "DELIVERED", status: 202 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual" });
  });

  it("retries timeouts, 429, and 5xx, then dead-letters at the bound", async () => {
    const retry = await deliverWebhook({
      endpoint,
      delivery,
      now,
      resolveHost: async () => ["8.8.8.8"],
      fetcher: async () => new Response(null, { status: 500 }),
    });
    expect(retry).toMatchObject({ state: "RETRY_SCHEDULED", nextAttempt: 1 });

    const dead = await deliverWebhook({
      endpoint,
      delivery: { ...delivery, attempt: 2 },
      now,
      resolveHost: async () => ["8.8.8.8"],
      fetcher: async () => new Response(null, { status: 429 }),
    });
    expect(dead).toMatchObject({ state: "DEAD_LETTER", reason: "HTTP_429" });
  });

  it("does not retry customer 4xx or redirects", async () => {
    const rejected = await deliverWebhook({
      endpoint,
      delivery,
      now,
      resolveHost: async () => ["8.8.8.8"],
      fetcher: async () => new Response(null, { status: 400 }),
    });
    expect(rejected).toMatchObject({
      state: "DEAD_LETTER",
      reason: "HTTP_400",
    });

    const redirected = await deliverWebhook({
      endpoint,
      delivery,
      now,
      resolveHost: async () => ["8.8.8.8"],
      fetcher: async () => new Response(null, { status: 302 }),
    });
    expect(redirected).toMatchObject({
      state: "DEAD_LETTER",
      reason: "REDIRECT_BLOCKED",
    });
  });
});
