# Outbound Delivery Profile

This is the production-oriented delivery contract for synthetic
`protection-review-case/1.0` events. It is mapping-ready until a customer supplies
an approved endpoint, secret custody, test receiver, and operating requirements.

## Reliability model

- The review row, audit row, and outbox row are written in one PostgreSQL
  transaction.
- The delivery ID and idempotency key remain stable across retries.
- A worker claims due rows with `FOR UPDATE SKIP LOCKED` and a stale-lock timeout.
- Timeout, DNS/TLS failure, HTTP 408, 429, and 5xx use bounded exponential retry.
- Redirects and other 4xx responses dead-letter immediately. The worker never
  follows redirects.
- Manual replay appends a replay receipt and requeues the original outbox event;
  it does not rewrite the dead letter.

## Destination safety

- HTTPS is mandatory.
- Hostnames must match the endpoint allowlist exactly.
- DNS is resolved immediately before delivery.
- Loopback, link-local, private, carrier-grade NAT, documentation, multicast,
  reserved, and IPv4-mapped private IPv6 addresses are rejected.
- Endpoint user information and redirects are forbidden.

## Delivery signature

The JSON body is canonically serialized. The sender includes `Content-Digest`,
`Idempotency-Key`, `X-Product-Delivery-Id`, `X-Product-Timestamp`, and
`X-Product-Signature`. The signature is HMAC-SHA256 over:

```text
POST
{path-and-query}
content-digest:{Content-Digest}
delivery-id:{X-Product-Delivery-Id}
timestamp:{X-Product-Timestamp}
idempotency-key:{Idempotency-Key}
```

Secrets live only in the deployment secret manager under
`OUTBOUND_WEBHOOK_SECRETS_JSON`; the database stores a secret reference and
version, never the secret value.
