import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";
import { hmacSha256Hex, sha256Base64 } from "@/domain/crypto/receipts";
import { stableStringify } from "@/domain/reconciliation/hash";

export const OutboxDeliveryStateSchema = z.enum([
  "PENDING",
  "RETRY_SCHEDULED",
  "DELIVERED",
  "DEAD_LETTER",
]);

export type WebhookEndpoint = {
  url: string;
  allowedHosts: string[];
  secret: string;
};

export type OutboxDelivery = {
  deliveryId: string;
  idempotencyKey: string;
  payload: unknown;
  attempt: number;
  maxAttempts: number;
};

function privateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && parts[2] === 100))) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}

export function isPrivateOrReservedAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return privateIpv4(address);
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return privateIpv4(mapped);
    }
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff")
    );
  }
  return true;
}

export function validateWebhookDestination(input: {
  url: string;
  allowedHosts: readonly string[];
  resolvedAddresses: readonly string[];
}) {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return { ok: false as const, reason: "INVALID_URL" };
  }
  if (url.protocol !== "https:")
    return { ok: false as const, reason: "HTTPS_REQUIRED" };
  if (url.username || url.password)
    return { ok: false as const, reason: "USERINFO_FORBIDDEN" };
  if (!input.allowedHosts.includes(url.hostname))
    return { ok: false as const, reason: "HOST_NOT_ALLOWLISTED" };
  if (
    !input.resolvedAddresses.length ||
    input.resolvedAddresses.some(isPrivateOrReservedAddress)
  ) {
    return { ok: false as const, reason: "PRIVATE_OR_UNRESOLVED_ADDRESS" };
  }
  return { ok: true as const, url };
}

export async function resolveWebhookHost(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
}

export function webhookHeaders(input: {
  body: string;
  target: string;
  deliveryId: string;
  idempotencyKey: string;
  timestamp: string;
  secret: string;
}) {
  const digest = `sha-256=:${sha256Base64(input.body)}:`;
  const canonical = [
    "POST",
    input.target,
    `content-digest:${digest}`,
    `delivery-id:${input.deliveryId}`,
    `timestamp:${input.timestamp}`,
    `idempotency-key:${input.idempotencyKey}`,
  ].join("\n");
  return {
    "Content-Type": "application/json",
    "Content-Digest": digest,
    "Idempotency-Key": input.idempotencyKey,
    "X-Product-Delivery-Id": input.deliveryId,
    "X-Product-Timestamp": input.timestamp,
    "X-Product-Signature": `sha256=${hmacSha256Hex(input.secret, canonical)}`,
  };
}

export async function deliverWebhook(input: {
  endpoint: WebhookEndpoint;
  delivery: OutboxDelivery;
  now: Date;
  resolveHost?: (hostname: string) => Promise<string[]>;
  fetcher?: typeof fetch;
}) {
  const url = new URL(input.endpoint.url);
  let resolvedAddresses: string[];
  try {
    resolvedAddresses = await (input.resolveHost ?? resolveWebhookHost)(
      url.hostname,
    );
  } catch {
    return retryOrDead(input.delivery, "DNS_FAILURE", input.now);
  }
  const destination = validateWebhookDestination({
    url: input.endpoint.url,
    allowedHosts: input.endpoint.allowedHosts,
    resolvedAddresses,
  });
  if (!destination.ok) {
    return { state: "DEAD_LETTER" as const, reason: destination.reason };
  }

  const body = stableStringify(input.delivery.payload);
  const timestamp = input.now.toISOString();
  const headers = webhookHeaders({
    body,
    target: `${destination.url.pathname}${destination.url.search}`,
    deliveryId: input.delivery.deliveryId,
    idempotencyKey: input.delivery.idempotencyKey,
    timestamp,
    secret: input.endpoint.secret,
  });
  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)(destination.url, {
      method: "POST",
      body,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return retryOrDead(input.delivery, "NETWORK_OR_TLS_FAILURE", input.now);
  }
  if (response.status >= 200 && response.status < 300) {
    return { state: "DELIVERED" as const, status: response.status, headers };
  }
  if (response.status >= 300 && response.status < 400) {
    return {
      state: "DEAD_LETTER" as const,
      reason: "REDIRECT_BLOCKED",
      status: response.status,
    };
  }
  if (
    response.status === 408 ||
    response.status === 429 ||
    response.status >= 500
  ) {
    return retryOrDead(input.delivery, `HTTP_${response.status}`, input.now);
  }
  return {
    state: "DEAD_LETTER" as const,
    reason: `HTTP_${response.status}`,
    status: response.status,
  };
}

function retryOrDead(delivery: OutboxDelivery, reason: string, now: Date) {
  const nextAttempt = delivery.attempt + 1;
  if (nextAttempt >= delivery.maxAttempts) {
    return { state: "DEAD_LETTER" as const, reason };
  }
  const delaySeconds = Math.min(3_600, 2 ** Math.max(0, nextAttempt - 1) * 30);
  return {
    state: "RETRY_SCHEDULED" as const,
    reason,
    nextAttempt,
    availableAt: new Date(now.getTime() + delaySeconds * 1_000).toISOString(),
  };
}
