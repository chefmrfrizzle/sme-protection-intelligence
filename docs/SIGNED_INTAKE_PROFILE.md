# Signed Canonical Intake Profile v1

This profile is for the `POST /api/events` production-oriented boundary. The
unsigned endpoint remains available only for the deterministic synthetic preview.

## Required headers

- `Content-Digest: sha-256=:BASE64_SHA256_OF_EXACT_BODY_BYTES:`
- `Idempotency-Key`: must equal the envelope `idempotencyKey`
- `X-Product-Key-Id`: tenant credential identifier
- `X-Product-Created-At`: ISO 8601 timestamp
- `X-Product-Expires-At`: ISO 8601 timestamp, no more than five minutes later
- `X-Product-Nonce`: unique random value of at least 16 characters
- `X-Product-Signature: sha256=HEX_HMAC_SHA256`

## Exact canonical string

Join these lines with a single line-feed (`\n`) and no trailing line-feed:

```text
POST
/api/events
content-digest:{Content-Digest}
organization-id:{body.organizationId}
key-id:{X-Product-Key-Id}
created-at:{X-Product-Created-At}
expires-at:{X-Product-Expires-At}
nonce:{X-Product-Nonce}
idempotency-key:{Idempotency-Key}
```

Calculate HMAC-SHA256 over the UTF-8 bytes of that string using the credential
secret. Encode the result as lowercase hexadecimal after `sha256=`. Verification
uses a constant-time comparison and supports one previous secret during rotation.

The signature covers the exact request body through `Content-Digest`, the method,
target, tenant, credential, freshness window, nonce, and idempotency key. Secrets
and document bodies must never be logged.
